#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage: $0 <iterations> [prd_file]

Examples:
  $0 10
  $0 20 prd.json

Env options:
  RALPH_AUTO_SWITCH_BRANCH=1        Auto checkout/create branchName from PRD
  RALPH_MAX_STAGNANT=2              Stop after N stagnant iterations (no PRD change)
  RALPH_ENABLE_FINAL_REVIEW=true    Run final AI review loop when all stories pass
  RALPH_MEMORY_FILE=tmp/ralph-memory.jsonl  Structured memory file shared across iterations
  RALPH_NO_QUESTIONS=true           Force autonomous mode (never ask user questions)
USAGE
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command not found: $1"
    exit 1
  fi
}

detect_prd_file() {
  local explicit="${1:-}"
  if [[ -n "$explicit" ]]; then
    echo "$explicit"
    return
  fi

  if [[ -f "prd.json" ]]; then
    echo "prd.json"
    return
  fi

  if [[ -f "prd_refactor.json" ]]; then
    echo "prd_refactor.json"
    return
  fi

  echo ""
}

json_get_raw() {
  local query="$1"
  jq -r "$query" "$PRD_FILE"
}

json_write() {
  if [[ $# -lt 1 ]]; then
    echo "Error: json_write requires at least a jq filter."
    exit 1
  fi

  local filter="${!#}"
  local jq_args=()
  if [[ $# -gt 1 ]]; then
    jq_args=("${@:1:$(($# - 1))}")
  fi

  local tmp
  tmp=$(mktemp)
  jq "${jq_args[@]}" "$filter" "$PRD_FILE" > "$tmp"
  mv "$tmp" "$PRD_FILE"
}

detect_story_key() {
  if jq -e '.stories | type == "array"' "$PRD_FILE" >/dev/null 2>&1; then
    echo "stories"
    return
  fi

  if jq -e '.componentStories | type == "array"' "$PRD_FILE" >/dev/null 2>&1; then
    echo "componentStories"
    return
  fi

  if jq -e '.userStories | type == "array"' "$PRD_FILE" >/dev/null 2>&1; then
    echo "userStories"
    return
  fi

  echo ""
}

all_stories_done() {
  jq -e --arg key "$STORY_KEY" '[.[ $key ][] | select((.passes // false) != true)] | length == 0' "$PRD_FILE" >/dev/null
}

next_unfinished_story_id() {
  jq -r --arg key "$STORY_KEY" '
    .[$key]
    | map(select((.passes // false) != true))
    | sort_by((.priority // 999999), (.id // ""))
    | .[0].id // empty
  ' "$PRD_FILE"
}

next_runnable_story_id() {
  jq -r --arg key "$STORY_KEY" '
    .[$key] as $all
    | $all
    | map(select(
        (.passes // false) != true
        and ((.loopState.status // "pending") != "blocked")
        and ((.dependsOn // []) | all(. as $dep | $all | map(select(.id == $dep and (.passes // false) == true)) | length > 0))
      ))
    | sort_by((.priority // 999999), (.id // ""))
    | .[0].id // empty
  ' "$PRD_FILE"
}

story_attempt_count() {
  local story_id="$1"
  jq -r --arg key "$STORY_KEY" --arg id "$story_id" '
    .[$key][] | select(.id == $id) | (.loopState.attempt // 0)
  ' "$PRD_FILE"
}

increment_story_attempt() {
  local story_id="$1"
  json_write --arg key "$STORY_KEY" --arg id "$story_id" '
    .[$key] |= map(
      if .id == $id then
        .loopState = (.loopState // {})
        | .loopState.attempt = ((.loopState.attempt // 0) + 1)
        | .loopState.phase = "implementing"
        | .loopState.status = "in_progress"
      else . end
    )
  '
}

mark_story_blocked() {
  local story_id="$1"
  local reason="$2"

  json_write --arg key "$STORY_KEY" --arg id "$story_id" --arg reason "$reason" '
    .[$key] |= map(
      if .id == $id then
        .passes = false
        | .loopState = (.loopState // {})
        | .loopState.status = "blocked"
        | .loopState.phase = "blocked"
        | .loopState.errors = ((.loopState.errors // []) + [$reason])
        | .notes = ((.notes // "")
          + (if (.notes // "") == "" then "" else "\n" end)
          + "[BLOCKED] " + $reason)
      else . end
    )
  '
}

story_payload() {
  local story_id="$1"
  jq --arg key "$STORY_KEY" --arg id "$story_id" '
    .[$key][] | select(.id == $id)
  ' "$PRD_FILE"
}

story_execution_skill() {
  local story_id="$1"
  jq -r --arg key "$STORY_KEY" --arg id "$story_id" '
    .[$key][] | select(.id == $id)
    | (
        .metadata.executionSkill
        // (if (.data.copyComponentInput? != null) then "copy-component" else "" end)
      )
    // ""
  ' "$PRD_FILE"
}

story_copy_component_input() {
  local story_id="$1"
  jq -c --arg key "$STORY_KEY" --arg id "$story_id" '
    .[$key][] | select(.id == $id) | (.data.copyComponentInput // empty)
  ' "$PRD_FILE"
}

run_claude_stream() {
  local prompt="$1"
  local tmpfile="$2"

  local stream_text final_result
  stream_text='select(.type == "assistant").message.content[]? | select(.type == "text").text // empty | gsub("\n"; "\r\n") | . + "\r\n\n"'
  final_result='select(.type == "result").result // empty'

  claude \
    --dangerously-skip-permissions \
    --verbose \
    --print \
    --output-format stream-json \
    -p "$prompt" \
    | grep --line-buffered '^{' \
    | tee "$tmpfile" \
    | jq --unbuffered -rj "$stream_text"

  jq -r "$final_result" "$tmpfile"
}

run_final_review() {
  if [[ "$ENABLE_FINAL_REVIEW" != "true" ]]; then
    echo "Skipping final review (disabled)."
    return 0
  fi

  echo
  echo "Running final AI review loop (threshold: ${FINAL_REVIEW_MIN_SCORE}/10, max passes: ${FINAL_REVIEW_MAX_PASSES})"

  for ((pass=1; pass<=FINAL_REVIEW_MAX_PASSES; pass++)); do
    echo "Final review pass $pass"

    local review_prompt tmpfile result score autonomy_review_rule review_memory_ref
    tmpfile=$(mktemp)
    autonomy_review_rule="0. Use best judgment and proceed autonomously."
    if [[ "$NO_QUESTIONS" == "true" ]]; then
      autonomy_review_rule="0. Never ask the user questions. Use best judgment and proceed autonomously."
    fi

    review_memory_ref=""
    if [[ -s "$MEMORY_FILE" ]]; then
      review_memory_ref="@${MEMORY_FILE}"
    fi

review_prompt=$(cat <<REVIEW_PROMPT
@${PRD_FILE} ${review_memory_ref}
Perform a final code review against the full PRD and repository changes.

Rules:
${autonomy_review_rule}
1. Review all completed stories and acceptance criteria.
2. If issues exist, implement fixes directly.
3. Run the required checks from PRD loopConfig.requiredChecks and story acceptance criteria.
4. Commit fixes if any were made.
5. Provide a score tag: <quality_score>N</quality_score> where N is 0-10.
6. If score >= ${FINAL_REVIEW_MIN_SCORE} and no unresolved blockers remain, output <promise>REVIEW_PASS</promise>.
7. If fixes were applied but more work remains, output <promise>REVIEW_FIX_APPLIED</promise>.
8. If blocked by required human action, output <promise>REVIEW_BLOCKED</promise> and explain exactly what is needed.
REVIEW_PROMPT
)

    if ! result=$(run_claude_stream "$review_prompt" "$tmpfile"); then
      rm -f "$tmpfile"
      echo "Review pass $pass failed to execute. Retrying next pass."
      continue
    fi
    rm -f "$tmpfile"

    score=$(printf '%s' "$result" | sed -n 's/.*<quality_score>\([0-9][0-9]*\)<\/quality_score>.*/\1/p' | tail -n1)
    if [[ -z "$score" ]]; then
      score=0
    fi

    if [[ "$result" == *"<promise>REVIEW_BLOCKED</promise>"* ]]; then
      echo "Final review blocked by human action."
      return 1
    fi

    if [[ "$result" == *"<promise>REVIEW_PASS</promise>"* ]] && (( score >= FINAL_REVIEW_MIN_SCORE )); then
      echo "Final review passed with quality score $score."
      return 0
    fi

    echo "Review threshold not met yet (score: $score)."
  done

  echo "Final review max passes reached without meeting threshold."
  return 1
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

ITERATIONS="$1"
PRD_FILE="$(detect_prd_file "${2:-}")"

if [[ -z "$PRD_FILE" ]]; then
  echo "Error: No PRD file found. Provide one explicitly or create prd.json/prd_refactor.json."
  exit 1
fi

if [[ ! -f "$PRD_FILE" ]]; then
  echo "Error: PRD file not found: $PRD_FILE"
  exit 1
fi

require_cmd jq
require_cmd claude
require_cmd git
require_cmd shasum

STORY_KEY="$(detect_story_key)"
if [[ -z "$STORY_KEY" ]]; then
  echo "Error: PRD must contain stories[] (preferred), componentStories[], or userStories[]"
  exit 1
fi

MODE=$(json_get_raw '.loopConfig.mode // empty')
LOOP_MAX_PER_STORY=$(json_get_raw '.loopConfig.maxIterationsPerStory // 3')
STOP_ON_BLOCKED=$(json_get_raw '.loopConfig.stopOnBlockedCheckpoint // true')
ORDERED_BY_PRIORITY=$(json_get_raw '.loopConfig.orderedByPriority // true')
ENABLE_FINAL_REVIEW="${RALPH_ENABLE_FINAL_REVIEW:-$(json_get_raw '.loopConfig.finalReview.enabled // true')}"
FINAL_REVIEW_MIN_SCORE=$(json_get_raw '.loopConfig.finalReview.minScore // 8')
FINAL_REVIEW_MAX_PASSES=$(json_get_raw '.loopConfig.finalReview.maxPasses // 3')
MAX_STAGNANT="${RALPH_MAX_STAGNANT:-$(json_get_raw '.loopConfig.maxStagnantIterations // 2')}"
MEMORY_FILE="${RALPH_MEMORY_FILE:-$(json_get_raw '.loopConfig.memoryFile // "tmp/ralph-memory.jsonl"')}"
REQUIRED_CHECKS=$(json_get_raw '.loopConfig.requiredChecks // [] | join("\n  - ")')
NO_QUESTIONS="${RALPH_NO_QUESTIONS:-$(json_get_raw '.loopConfig.autonomy.noQuestions // true')}"
ASSUME_BEST_JUDGMENT="$(json_get_raw '.loopConfig.autonomy.assumeBestJudgment // true')"
TARGET_BRANCH=$(json_get_raw '.branchName // empty')

if [[ "$ORDERED_BY_PRIORITY" != "true" ]]; then
  echo "Warning: orderedByPriority=false is set, but script currently still processes in priority order for determinism."
fi

current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ -n "$TARGET_BRANCH" && "$current_branch" != "$TARGET_BRANCH" ]]; then
  if [[ "${RALPH_AUTO_SWITCH_BRANCH:-0}" == "1" ]]; then
    if git show-ref --verify --quiet "refs/heads/$TARGET_BRANCH"; then
      git checkout "$TARGET_BRANCH"
    else
      git checkout -b "$TARGET_BRANCH"
    fi
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    echo "Switched to branch: $current_branch"
  else
    echo "Error: Current branch is '$current_branch' but PRD requests '$TARGET_BRANCH'."
    echo "Set RALPH_AUTO_SWITCH_BRANCH=1 to auto-switch/create branch."
    exit 1
  fi
fi

echo "Running Ralph loop for $ITERATIONS iterations"
echo "PRD: $PRD_FILE"
echo "Memory file: $MEMORY_FILE"
if [[ -n "$MODE" ]]; then
  echo "Mode: $MODE"
fi
echo "Stories key: $STORY_KEY"
echo "Per-story max attempts: $LOOP_MAX_PER_STORY"
echo "Stop on blocked checkpoint: $STOP_ON_BLOCKED"
echo "Autonomy no-questions: $NO_QUESTIONS"
echo "Autonomy assume-best-judgment: $ASSUME_BEST_JUDGMENT"

stagnant_count=0

for ((i=1; i<=ITERATIONS; i++)); do
  echo
  echo "Iteration $i"

  if all_stories_done; then
    echo "All stories already marked complete."
    if run_final_review; then
      echo "All PRD tasks complete with final review pass."
      exit 0
    fi
    echo "Final review did not pass threshold."
    exit 1
  fi

  top_unfinished_id=$(next_unfinished_story_id)
  next_story_id=$(next_runnable_story_id)

  if [[ -z "$next_story_id" ]]; then
    if [[ "$STOP_ON_BLOCKED" == "true" && -n "$top_unfinished_id" ]]; then
      echo "Top unfinished story is blocked: $top_unfinished_id"
      echo "Stopping due to stopOnBlockedCheckpoint=true"
      exit 2
    fi

    echo "No runnable stories available (all remaining may be blocked)."
    exit 2
  fi

  attempts=$(story_attempt_count "$next_story_id")
  if (( attempts >= LOOP_MAX_PER_STORY )); then
    reason="Max attempts reached (${LOOP_MAX_PER_STORY})"
    echo "Blocking story $next_story_id: $reason"
    mark_story_blocked "$next_story_id" "$reason"

    if [[ "$STOP_ON_BLOCKED" == "true" ]]; then
      echo "Stopping due to stopOnBlockedCheckpoint=true"
      exit 2
    fi
    continue
  fi

  increment_story_attempt "$next_story_id"

  before_hash=$(shasum -a 256 "$PRD_FILE" | awk '{print $1}')
  tmpfile=$(mktemp)
  story_json=$(story_payload "$next_story_id")
  execution_skill=$(story_execution_skill "$next_story_id")
  copy_component_input=$(story_copy_component_input "$next_story_id")
  mkdir -p "$(dirname "$MEMORY_FILE")"
  touch "$MEMORY_FILE"

  memory_ref=""
  if [[ -s "$MEMORY_FILE" ]]; then
    memory_ref="@${MEMORY_FILE}"
  fi

  task_no_questions_rule="4. Use best judgment to resolve ambiguity and continue."
  if [[ "$NO_QUESTIONS" == "true" ]]; then
    task_no_questions_rule="4. Never ask the user questions. If details are missing/ambiguous, choose the most reasonable default and continue."
  fi
  assumption_rule="5. Record assumptions in story notes and in ${MEMORY_FILE}."
  if [[ "$ASSUME_BEST_JUDGMENT" != "true" ]]; then
    assumption_rule="5. If assumptions are not allowed by PRD policy, block the story with explicit reason."
  fi

  execution_skill_rule=""
  if [[ -n "$execution_skill" ]]; then
    execution_skill_rule="   Execution skill requirement: use /${execution_skill} for implementation; do not bypass with manual alternative."
  fi
  if [[ "$execution_skill" == "copy-component" ]]; then
    if [[ -z "$copy_component_input" ]]; then
      reason="executionSkill=copy-component but data.copyComponentInput is missing"
      echo "Blocking story $next_story_id: $reason"
      mark_story_blocked "$next_story_id" "$reason"
      if [[ "$STOP_ON_BLOCKED" == "true" ]]; then
        echo "Stopping due to stopOnBlockedCheckpoint=true"
        exit 2
      fi
      continue
    fi
    execution_skill_rule=$(cat <<SKILL_RULE
   Execution skill requirement: use /copy-component for implementation; do not bypass with manual alternative.
   When invoking /copy-component, pass this exact payload:
   ${copy_component_input}
SKILL_RULE
)
  fi

  if [[ -n "$REQUIRED_CHECKS" ]]; then
    required_checks_rule="3. Run these required checks (from loopConfig.requiredChecks):
  - ${REQUIRED_CHECKS}
   Additionally run any checks specified in this story's acceptanceCriteria."
  else
    required_checks_rule="3. Run any checks specified in this story's acceptanceCriteria."
  fi

  task_prompt=$(cat <<TASK_PROMPT
@${PRD_FILE} ${memory_ref}
You are running Ralph loop for one story only.

Target story id: ${next_story_id}
Story payload:
${story_json}

Execution rules (strict):
1. Work ONLY on target story id ${next_story_id}.
2. Implement the story end-to-end.
${execution_skill_rule}
${required_checks_rule}
${task_no_questions_rule}
${assumption_rule}
6. If blocked by mandatory human checkpoints defined in this story (for example metadata/checkpoints), mark the story blocked in PRD with explicit reason.
7. Update PRD state for this story:
   - on success: passes=true, loopState.status=\"completed\", loopState.phase=\"done\".
   - on blocked: loopState.status=\"blocked\" and add precise error note.
8. Append one JSON line to ${MEMORY_FILE} with keys: timestamp, storyId, summary, reusableNotes, touchedFiles, blockers, assumptions.
9. Commit changes for this story.
10. Output <promise>COMPLETE</promise> when done with this story.
11. If all stories are complete, output <promise>ALL_DONE</promise>.
12. If this story cannot proceed due to blockers, output <promise>BLOCKED</promise>.
TASK_PROMPT
)

  if ! result=$(run_claude_stream "$task_prompt" "$tmpfile"); then
    rm -f "$tmpfile"
    reason="Claude execution failed for story ${next_story_id}"
    echo "$reason"
    mark_story_blocked "$next_story_id" "$reason"
    if [[ "$STOP_ON_BLOCKED" == "true" ]]; then
      echo "Stopping due to stopOnBlockedCheckpoint=true"
      exit 2
    fi
    continue
  fi
  rm -f "$tmpfile"

  after_hash=$(shasum -a 256 "$PRD_FILE" | awk '{print $1}')

  if [[ "$result" == *"<promise>ALL_DONE</promise>"* ]]; then
    echo "Model signaled ALL_DONE. Running final review."
    if run_final_review; then
      echo "All PRD tasks complete with final review pass."
      exit 0
    fi
    echo "Final review did not pass threshold."
    exit 1
  fi

  if [[ "$result" == *"<promise>BLOCKED</promise>"* ]]; then
    echo "Model signaled story blocked: $next_story_id"
    if [[ "$STOP_ON_BLOCKED" == "true" ]]; then
      echo "Stopping due to stopOnBlockedCheckpoint=true"
      exit 2
    fi
  elif [[ "$result" != *"<promise>COMPLETE</promise>"* ]]; then
    echo "Warning: model did not output COMPLETE/BLOCKED marker."
  fi

  if [[ "$before_hash" == "$after_hash" ]]; then
    stagnant_count=$((stagnant_count + 1))
    echo "Warning: PRD unchanged this iteration (stagnant count: $stagnant_count/$MAX_STAGNANT)."
  else
    stagnant_count=0
  fi

  if (( stagnant_count >= MAX_STAGNANT )); then
    echo "Stopping: loop appears stagnant."
    exit 3
  fi
done

echo "Reached iteration limit ($ITERATIONS)."
if all_stories_done; then
  run_final_review
fi
