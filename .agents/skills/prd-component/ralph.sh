#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  kill -- -$$ 2>/dev/null || true
  exit 130
}
trap cleanup INT TERM

# ── UI helpers ──────────────────────────────────────────────

BOLD='\033[1m'
DIM='\033[2m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RESET='\033[0m'

line() { printf "${DIM}%0.s─${RESET}" $(seq 1 60); echo; }

header() {
  local label="$1"
  echo
  line
  printf "  ${BOLD}${CYAN}%s${RESET}\n" "$label"
  line
}

info()  { printf "  ${DIM}%-28s${RESET} %s\n" "$1" "$2"; }
ok()    { printf "  ${GREEN}✓${RESET} %s\n" "$1"; }
warn()  { printf "  ${YELLOW}⚠${RESET} %s\n" "$1" >&2; }
err()   { printf "  ${RED}✗${RESET} %s\n" "$1" >&2; }
step()  { printf "\n  ${BOLD}${BLUE}▶${RESET} %s\n\n" "$1"; }

# ────────────────────────────────────────────────────────────

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

  if ! jq "${jq_args[@]}" "$filter" "$PRD_FILE" > "$tmp"; then
    echo "Error: json_write jq filter failed (exit $?)."
    rm -f "$tmp"
    return 1
  fi

  if ! jq -e '.' "$tmp" >/dev/null 2>&1; then
    echo "Error: json_write produced invalid JSON."
    rm -f "$tmp"
    return 1
  fi

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

schema_contract() {
  cat <<'SCHEMA'
{
  "rootRequired": ["project", "branchName", "loopConfig", "stories"],
  "storyRequired": ["id", "title", "acceptanceCriteria"],
  "storyStatusAllowed": ["open", "in_progress", "blocked", "completed", "done", "closed", "resolved"],
  "loopStatePhaseValues": ["queued", "implementing", "done", "blocked"],
  "loopStateStatusAllowed": ["pending", "in_progress", "blocked", "completed", "done"],
  "phaseTransitions": "queued -> implementing -> done | blocked",
  "fieldReference": {
    "status": "Top-level story status. Controls visibility in next_runnable_story_id.",
    "passes": "Boolean. true = story accepted. Used by dependency resolution and loop exit.",
    "loopState.status": "Loop-internal status. Mirrors status but scoped to automation.",
    "loopState.phase": "Current phase in the loop lifecycle.",
    "loopState.attempt": "Integer. Incremented each iteration. Compared against maxIterationsPerStory.",
    "loopState.errors": "Array of error strings appended on failure."
  },
  "dependsOn": "Array of story IDs. All deps must have passes=true OR status in [done, completed, closed, resolved] before this story is runnable.",
  "updateRules": {
    "onSuccess": "Set passes=true, status='completed', loopState.status='completed', loopState.phase='done'.",
    "onBlocked": "Set passes=false, status='blocked', loopState.status='blocked', loopState.phase='blocked'. Append reason to loopState.errors and notes.",
    "atomicity": "Update ALL fields in a single jq write. Partial updates corrupt state.",
    "preserveExisting": "Never clear loopState.errors or notes — only append."
  },
  "memoryFileFormat": "JSONL. Each line: {timestamp, storyId, summary, reusableNotes, touchedFiles, blockers, assumptions}"
}
SCHEMA
}

normalize_prd_schema() {
  local key="$1"

  json_write --arg key "$key" '
    .[$key] |= (
      to_entries
      | map(
          .key as $idx
          | .value = (
              .value
              | .passes = (.passes // false)
              | .priority = (
                  if ((.priority | type) == "number") then .priority else ($idx + 1) end
                )
              | .acceptanceCriteria = (.acceptanceCriteria // [])
              | .status = (
                  ((.status // (if .passes then "completed" else "open" end)) | ascii_downcase) as $st
                  | if ($st | IN("open", "in_progress", "blocked", "completed", "done", "closed", "resolved"))
                    then $st
                    else "open"
                    end
                )
              | .loopState = (.loopState // {})
              | .loopState.status = (
                  ((.loopState.status // (
                      if .status == "blocked" then "blocked"
                      elif (.status | IN("completed", "done", "closed", "resolved")) then "completed"
                      else "pending"
                      end
                    )) | ascii_downcase) as $ls
                  | if ($ls | IN("pending", "in_progress", "blocked", "completed", "done"))
                    then $ls
                    else "pending"
                    end
                )
              | .loopState.phase = (.loopState.phase // "queued")
              | .loopState.attempt = (
                  if ((.loopState.attempt | type) == "number") then .loopState.attempt else 0 end
                )
              | .loopState.errors = (.loopState.errors // [])
            )
        )
      | map(.value)
    )
  '
}

validate_prd_schema() {
  local key="$1"

  if ! jq -e --arg key "$key" '.[$key] | type == "array"' "$PRD_FILE" >/dev/null; then
    echo "Error: PRD schema invalid - .$key must be an array."
    exit 1
  fi

  if ! jq -e --arg key "$key" '
    .[$key]
    | all(
        (.id | type) == "string"
        and (.title | type) == "string"
        and ((.acceptanceCriteria // []) | type) == "array"
        and ((.loopState // {}) | type) == "object"
        and (((.status // "open") | ascii_downcase) | IN("open", "in_progress", "blocked", "completed", "done", "closed", "resolved"))
        and (((.loopState.status // "pending") | ascii_downcase) | IN("pending", "in_progress", "blocked", "completed", "done"))
      )
  ' "$PRD_FILE" >/dev/null; then
    echo "Error: PRD schema invalid - each story must have id/title strings, acceptanceCriteria array, and valid status/loopState.status values."
    exit 1
  fi
}

all_stories_done() {
  local rc=0
  jq -e --arg key "$STORY_KEY" '
    [
      .[$key][] |
      select(
        ((.passes // false) != true)
        and ((.status // "" | ascii_downcase) | IN("done", "completed", "closed", "resolved") | not)
      )
    ] | length == 0
  ' "$PRD_FILE" >/dev/null 2>&1 || rc=$?

  if (( rc >= 2 )); then
    echo "Error: all_stories_done jq parse error (exit $rc)."
    return 2
  fi

  return "$rc"
}

next_unfinished_story_id() {
  jq -r --arg key "$STORY_KEY" '
    .[$key]
    | map(select(
        ((.passes // false) != true)
        and ((.status // "" | ascii_downcase) | IN("done", "completed", "closed", "resolved") | not)
      ))
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
        and ((.status // "" | ascii_downcase) | IN("done", "completed", "closed", "resolved") | not)
        and ((.status // "" | ascii_downcase) != "blocked")
        and ((.loopState.status // "pending") != "blocked")
        and ((.dependsOn // []) | all(. as $dep | $all | map(select(
              .id == $dep
              and (
                (.passes // false) == true
                or ((.status // "" | ascii_downcase) | IN("done", "completed", "closed", "resolved"))
              )
            )) | length > 0))
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
        | .status = "blocked"
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

constraints_context() {
  jq -c '
    {
      constraints: (.constraints // []),
      rules: (.rules // []),
      nonGoals: (.nonGoals // []),
      qualityGates: (.qualityGates // []),
      successMetrics: (.successMetrics // []),
      goals: (.goals // []),
      uiNotes: (.uiNotes // [])
    }
  ' "$PRD_FILE"
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

  local stream_filter final_result
  stream_filter='
    if .type == "assistant" then
      .message.content[]? |
      if .type == "text" then
        .text // empty | gsub("\n"; "\r\n") | . + "\r\n\n"
      elif .type == "tool_use" then
        .name as $tool | .input as $in |
        if $tool == "Read" then
          "\u001b[2m  [read] \($in.file_path // "?")\u001b[0m\r\n"
        elif $tool == "Edit" then
          "\u001b[2m  [edit] \($in.file_path // "?")\u001b[0m\r\n"
        elif $tool == "Write" then
          "\u001b[2m  [write] \($in.file_path // "?")\u001b[0m\r\n"
        elif $tool == "Bash" then
          "\u001b[2m  [bash] \($in.command // "?" | split("\n")[0] | if length > 60 then .[:60] + "..." else . end)\u001b[0m\r\n"
        elif $tool == "Glob" then
          "\u001b[2m  [glob] \($in.pattern // "?")\u001b[0m\r\n"
        elif $tool == "Grep" then
          "\u001b[2m  [grep] \($in.pattern // "?")\u001b[0m\r\n"
        elif $tool == "Skill" then
          "\u001b[2m  [skill] /\($in.skill // "?")\u001b[0m\r\n"
        elif $tool == "Task" then
          "\u001b[2m  [agent] \($in.description // "?")\u001b[0m\r\n"
        else
          "\u001b[2m  [\($tool)]\u001b[0m\r\n"
        end
      else empty
      end
    else empty
    end
  '
  final_result='select(.type == "result").result // empty'

  claude \
    --dangerously-skip-permissions \
    --verbose \
    --print \
    --output-format stream-json \
    -p "$prompt" \
    | grep --line-buffered '^{' \
    | tee "$tmpfile" \
    | jq --unbuffered -rj "$stream_filter" >&2

  jq -r "$final_result" "$tmpfile"
}

run_final_review() {
  if [[ "$ENABLE_FINAL_REVIEW" != "true" ]]; then
    info "Final review" "disabled — skipping"
    return 0
  fi

  header "Final Review (threshold: ${FINAL_REVIEW_MIN_SCORE}/10, max: ${FINAL_REVIEW_MAX_PASSES} passes)"

  for ((pass=1; pass<=FINAL_REVIEW_MAX_PASSES; pass++)); do
    step "Review pass ${pass}/${FINAL_REVIEW_MAX_PASSES}"

    local review_prompt tmpfile result score autonomy_review_rule review_memory_ref review_constraints
    tmpfile=$(mktemp)
    autonomy_review_rule="0. Use best judgment and proceed autonomously."
    if [[ "$NO_QUESTIONS" == "true" ]]; then
      autonomy_review_rule="0. Never ask the user questions. Use best judgment and proceed autonomously."
    fi

    review_memory_ref=""
    if [[ -s "$MEMORY_FILE" ]]; then
      review_memory_ref="@${MEMORY_FILE}"
    fi
    review_constraints=$(constraints_context)

review_prompt=$(cat <<REVIEW_PROMPT
@${PRD_FILE} ${review_memory_ref}
Perform a final code review against the full PRD and repository changes.

Rules:
${autonomy_review_rule}
PRD schema contract (must be followed):
${PRD_SCHEMA_CONTRACT}
Global constraints context (must be respected):
${review_constraints}
1. Review all completed stories and acceptance criteria.
2. If issues exist, implement fixes directly.
3. Enforce global constraints context (especially rules/nonGoals/qualityGates).
4. Run the required checks from PRD loopConfig.requiredChecks and story acceptance criteria.
5. Commit fixes if any were made.
6. Provide a score tag: <quality_score>N</quality_score> where N is 0-10.
7. If score >= ${FINAL_REVIEW_MIN_SCORE} and no unresolved blockers remain, output <promise>REVIEW_PASS</promise>.
8. If fixes were applied but more work remains, output <promise>REVIEW_FIX_APPLIED</promise>.
9. If blocked by required human action, output <promise>REVIEW_BLOCKED</promise> and explain exactly what is needed.
REVIEW_PROMPT
)

    if ! result=$(run_claude_stream "$review_prompt" "$tmpfile"); then
      rm -f "$tmpfile"
      warn "Review pass $pass failed to execute. Retrying next pass."
      continue
    fi
    rm -f "$tmpfile"

    score=$(printf '%s' "$result" | sed -n 's/.*<quality_score>\([0-9][0-9]*\)<\/quality_score>.*/\1/p' | tail -n1)
    if [[ -z "$score" ]]; then
      score=0
    fi

    if [[ "$result" == *"<promise>REVIEW_BLOCKED</promise>"* ]]; then
      err "Final review blocked by human action."
      return 1
    fi

    if [[ "$result" == *"<promise>REVIEW_PASS</promise>"* ]] && (( score >= FINAL_REVIEW_MIN_SCORE )); then
      ok "Final review passed (score: ${score}/10)."
      return 0
    fi

    warn "Review threshold not met (score: ${score}/10)."
  done

  err "Final review max passes reached without meeting threshold."
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
normalize_prd_schema "$STORY_KEY"
validate_prd_schema "$STORY_KEY"
PRD_SCHEMA_CONTRACT="$(schema_contract)"

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
  warn "orderedByPriority=false is set, but script still processes in priority order for determinism."
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
    ok "Switched to branch: $current_branch"
  else
    err "Current branch is '$current_branch' but PRD requests '$TARGET_BRANCH'."
    err "Set RALPH_AUTO_SWITCH_BRANCH=1 to auto-switch/create branch."
    exit 1
  fi
fi

header "Ralph Loop — ${ITERATIONS} iterations"
info "PRD" "$PRD_FILE"
info "Memory" "$MEMORY_FILE"
if [[ -n "$MODE" ]]; then
  info "Mode" "$MODE"
fi
info "Stories key" "$STORY_KEY"
info "Max attempts/story" "$LOOP_MAX_PER_STORY"
info "Stop on blocked" "$STOP_ON_BLOCKED"
info "No questions" "$NO_QUESTIONS"
info "Assume best judgment" "$ASSUME_BEST_JUDGMENT"

stagnant_count=0

for ((i=1; i<=ITERATIONS; i++)); do
  header "Iteration ${i}/${ITERATIONS}"

  asd_rc=0
  all_stories_done || asd_rc=$?
  if (( asd_rc == 2 )); then
    err "PRD parse error in all_stories_done. Restoring backup."
    if [[ -f "${PRD_FILE}.bak" ]]; then
      cp "${PRD_FILE}.bak" "$PRD_FILE"
    fi
    continue
  fi
  if (( asd_rc == 0 )); then
    ok "All stories already marked complete."
    if run_final_review; then
      ok "All PRD tasks complete with final review pass."
      rm -f "${PRD_FILE}.bak"
      exit 0
    fi
    err "Final review did not pass threshold."
    exit 1
  fi

  top_unfinished_id=$(next_unfinished_story_id)
  next_story_id=$(next_runnable_story_id)

  if [[ -z "$next_story_id" ]]; then
    if [[ "$STOP_ON_BLOCKED" == "true" && -n "$top_unfinished_id" ]]; then
      err "Top unfinished story is blocked: $top_unfinished_id"
      warn "Stopping — stopOnBlockedCheckpoint=true"
      exit 2
    fi

    err "No runnable stories available (all remaining may be blocked)."
    exit 2
  fi

  attempts=$(story_attempt_count "$next_story_id")
  if (( attempts >= LOOP_MAX_PER_STORY )); then
    reason="Max attempts reached (${LOOP_MAX_PER_STORY})"
    warn "Blocking story $next_story_id: $reason"
    mark_story_blocked "$next_story_id" "$reason"

    if [[ "$STOP_ON_BLOCKED" == "true" ]]; then
      warn "Stopping — stopOnBlockedCheckpoint=true"
      exit 2
    fi
    continue
  fi

  increment_story_attempt "$next_story_id"
  story_title=$(jq -r --arg key "$STORY_KEY" --arg id "$next_story_id" '.[$key][] | select(.id == $id) | .title' "$PRD_FILE")
  step "Story: ${next_story_id} — ${story_title}  (attempt $((attempts + 1))/${LOOP_MAX_PER_STORY})"

  cp "$PRD_FILE" "${PRD_FILE}.bak"
  before_hash=$(shasum -a 256 "$PRD_FILE" | awk '{print $1}')
  tmpfile=$(mktemp)

  if ! story_json=$(story_payload "$next_story_id") || [[ -z "$story_json" ]]; then
    reason="Failed to extract story payload for ${next_story_id}"
    err "Blocking story $next_story_id: $reason"
    mark_story_blocked "$next_story_id" "$reason"
    rm -f "$tmpfile"
    continue
  fi

  if ! global_constraints=$(constraints_context); then
    reason="Failed to extract constraints context"
    err "Blocking story $next_story_id: $reason"
    mark_story_blocked "$next_story_id" "$reason"
    rm -f "$tmpfile"
    continue
  fi

  if ! execution_skill=$(story_execution_skill "$next_story_id"); then
    reason="Failed to extract execution skill for ${next_story_id}"
    err "Blocking story $next_story_id: $reason"
    mark_story_blocked "$next_story_id" "$reason"
    rm -f "$tmpfile"
    continue
  fi

  copy_component_input=$(story_copy_component_input "$next_story_id" || true)
  mkdir -p "$(dirname "$MEMORY_FILE")"
  touch "$MEMORY_FILE"

  memory_ref=""
  if [[ -s "$MEMORY_FILE" ]]; then
    memory_ref="@${MEMORY_FILE}"
  fi

  task_no_questions_rule="5. Use best judgment to resolve ambiguity and continue."
  if [[ "$NO_QUESTIONS" == "true" ]]; then
    task_no_questions_rule="5. Never ask the user questions. If details are missing/ambiguous, choose the most reasonable default and continue."
  fi
  assumption_rule="6. Record assumptions in story notes and in ${MEMORY_FILE}."
  if [[ "$ASSUME_BEST_JUDGMENT" != "true" ]]; then
    assumption_rule="6. If assumptions are not allowed by PRD policy, block the story with explicit reason."
  fi

  execution_skill_rule=""
  if [[ -n "$execution_skill" ]]; then
    execution_skill_rule="   Execution skill requirement: use /${execution_skill} for implementation; do not bypass with manual alternative."
  fi
  if [[ "$execution_skill" == "copy-component" ]]; then
    if [[ -z "$copy_component_input" ]]; then
      reason="executionSkill=copy-component but data.copyComponentInput is missing"
      err "Blocking story $next_story_id: $reason"
      mark_story_blocked "$next_story_id" "$reason"
      if [[ "$STOP_ON_BLOCKED" == "true" ]]; then
        warn "Stopping — stopOnBlockedCheckpoint=true"
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
    required_checks_rule="4. Run these required checks (from loopConfig.requiredChecks):
  - ${REQUIRED_CHECKS}
   Additionally run any checks specified in this story's acceptanceCriteria."
  else
    required_checks_rule="4. Run any checks specified in this story's acceptanceCriteria."
  fi

  task_prompt=$(cat <<TASK_PROMPT
@${PRD_FILE} ${memory_ref}
You are running Ralph loop for one story only.

Target story id: ${next_story_id}
Story payload:
${story_json}

PRD schema contract (must be followed):
${PRD_SCHEMA_CONTRACT}

Global constraints context (must be respected):
${global_constraints}

Execution rules (strict):
1. Work ONLY on target story id ${next_story_id}.
2. Implement the story end-to-end.
3. Enforce the global constraints context above (especially rules/nonGoals/qualityGates).
${execution_skill_rule}
${required_checks_rule}
${task_no_questions_rule}
${assumption_rule}
7. If blocked by mandatory human checkpoints defined in this story (for example metadata/checkpoints), mark the story blocked in PRD with explicit reason.
8. Update PRD state for this story:
   - on success: passes=true, loopState.status=\"completed\", loopState.phase=\"done\"; set status=\"completed\".
   - on blocked: loopState.status=\"blocked\" and add precise error note; set status=\"blocked\".
9. Append one JSON line to ${MEMORY_FILE} with keys: timestamp, storyId, summary, reusableNotes, touchedFiles, blockers, assumptions.
10. Commit changes for this story.
11. Output <promise>COMPLETE</promise> when done with this story.
12. If all stories are complete, output <promise>ALL_DONE</promise>.
13. If this story cannot proceed due to blockers, output <promise>BLOCKED</promise>.
TASK_PROMPT
)

  if ! result=$(run_claude_stream "$task_prompt" "$tmpfile"); then
    rm -f "$tmpfile"
    reason="Claude execution failed for story ${next_story_id}"
    err "$reason"
    mark_story_blocked "$next_story_id" "$reason"
    if [[ "$STOP_ON_BLOCKED" == "true" ]]; then
      warn "Stopping — stopOnBlockedCheckpoint=true"
      exit 2
    fi
    continue
  fi
  rm -f "$tmpfile"

  if ! jq -e '.' "$PRD_FILE" >/dev/null 2>&1; then
    err "PRD corrupted after Claude call. Restoring backup."
    cp "${PRD_FILE}.bak" "$PRD_FILE"
    mark_story_blocked "$next_story_id" "PRD corrupted during execution — restored from backup"
    continue
  fi

  after_hash=$(shasum -a 256 "$PRD_FILE" | awk '{print $1}')

  if [[ "$result" == *"<promise>ALL_DONE</promise>"* ]]; then
    ok "All stories done. Running final review."
    if run_final_review; then
      ok "All PRD tasks complete with final review pass."
      rm -f "${PRD_FILE}.bak"
      exit 0
    fi
    err "Final review did not pass threshold."
    exit 1
  fi

  if [[ "$result" == *"<promise>BLOCKED</promise>"* ]]; then
    warn "Story blocked: $next_story_id"
    if [[ "$STOP_ON_BLOCKED" == "true" ]]; then
      warn "Stopping — stopOnBlockedCheckpoint=true"
      exit 2
    fi
  elif [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    ok "Story complete: $next_story_id"
  else
    warn "Model did not output COMPLETE/BLOCKED marker."
  fi

  if [[ "$before_hash" == "$after_hash" ]]; then
    stagnant_count=$((stagnant_count + 1))
    warn "PRD unchanged (stagnant ${stagnant_count}/${MAX_STAGNANT})."
  else
    stagnant_count=0
  fi

  if (( stagnant_count >= MAX_STAGNANT )); then
    err "Stopping: loop appears stagnant."
    exit 3
  fi
done

header "Loop finished — ${ITERATIONS} iterations"
asd_rc=0
all_stories_done || asd_rc=$?
if (( asd_rc == 2 )); then
  err "PRD parse error after loop. Cannot determine final status."
  exit 1
fi
if (( asd_rc == 0 )); then
  run_final_review
  rm -f "${PRD_FILE}.bak"
fi
