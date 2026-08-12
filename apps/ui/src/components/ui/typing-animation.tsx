"use client"

import {
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

import { cn } from "@/lib/styles"

interface Char {
  key: number
  char: string
  exiting: boolean
}

type Phase = "waiting" | "typing" | "deleting"

/** Must exceed `--animate-char-fade-out` (110ms). */
const EXIT_DURATION_MS = 250

interface TypingAnimationProps extends ComponentProps<"span"> {
  words: string[]
  typeSpeed?: number
  deleteSpeed?: number
  pauseDelay?: number
  startDelay?: number
  startTyped?: boolean
}

export function TypingAnimation({
  words,
  className,
  typeSpeed = 100,
  deleteSpeed = 80,
  pauseDelay = 1500,
  startDelay = 0,
  startTyped = false,
  ...props
}: TypingAnimationProps) {
  const hasWords = words.length > 0
  const firstWord = words[0] ?? ""
  const initialPhase: Phase =
    startTyped && startDelay > 0 ? "waiting" : "typing"
  const initialChars = useMemo(
    () =>
      startTyped
        ? Array.from(firstWord).map((char, index) => ({
            key: index,
            char,
            exiting: false,
          }))
        : [],
    [firstWord, startTyped]
  )
  const [wordIndex, setWordIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>(initialPhase)
  const [chars, setChars] = useState<Char[]>(initialChars)
  const nextKey = useRef(initialChars.length)
  const typingIndex = useRef(startTyped ? initialChars.length : 0)
  const prefersReducedMotion = usePrefersReducedMotion()

  const currentWord = hasWords ? (words[wordIndex] ?? firstWord) : ""
  const graphemes = useMemo(() => Array.from(currentWord), [currentWord])

  useEffect(() => {
    if (!hasWords || prefersReducedMotion || phase !== "waiting") {
      return
    }

    const timeout = setTimeout(() => {
      setPhase("deleting")
    }, startDelay)

    return () => clearTimeout(timeout)
  }, [hasWords, phase, prefersReducedMotion, startDelay])

  // Reset typing cursor when word changes
  useEffect(() => {
    typingIndex.current = 0
  }, [wordIndex])

  // Typing: add one character at a time
  useEffect(() => {
    if (!hasWords || prefersReducedMotion || phase !== "typing") {
      return
    }

    if (typingIndex.current >= graphemes.length) {
      const t = setTimeout(() => setPhase("deleting"), pauseDelay)

      return () => clearTimeout(t)
    }

    const t = setTimeout(() => {
      const char = graphemes[typingIndex.current]!
      typingIndex.current++
      setChars((prev) => [
        ...prev,
        { key: nextKey.current++, char, exiting: false },
      ])
    }, typeSpeed)

    return () => clearTimeout(t)
  }, [
    chars.length,
    graphemes,
    hasWords,
    pauseDelay,
    phase,
    prefersReducedMotion,
    typeSpeed,
  ])

  // Deleting: mark characters for exit on a steady interval
  useEffect(() => {
    if (!hasWords || prefersReducedMotion || phase !== "deleting") {
      return
    }

    const interval = setInterval(() => {
      setChars(markLastCharExiting)
    }, deleteSpeed)

    return () => clearInterval(interval)
  }, [deleteSpeed, hasWords, phase, prefersReducedMotion])

  // Advance once delete is done. Driven by a timer so a missed animationend
  // (e.g. background tab) cannot leave an empty word + blinking cursor.
  useEffect(() => {
    if (!hasWords || prefersReducedMotion || phase !== "deleting") {
      return
    }

    // Wait until every character has started exiting (or none left)
    if (chars.length > 0 && !chars.every((c) => c.exiting)) {
      return
    }

    const timeout = setTimeout(
      () => {
        setChars([])
        setWordIndex((index) => (index + 1) % words.length)
        setPhase("typing")
      },
      chars.length === 0 ? 0 : EXIT_DURATION_MS
    )

    return () => clearTimeout(timeout)
  }, [chars, hasWords, phase, prefersReducedMotion, words.length])

  // Visual only — state machine advances from the delete-finished effect above
  const handleAnimationEnd = useCallback((key: number) => {
    setChars((prev) => prev.filter((c) => c.key !== key))
  }, [])

  if (words.length === 0) {
    return null
  }

  // Reduced motion: show the first word statically with no typing/cursor motion.
  if (prefersReducedMotion) {
    return (
      <span
        {...props}
        className={cn("inline-block", className)}
        aria-label={props["aria-label"] ?? firstWord}
      >
        {firstWord}
      </span>
    )
  }

  return (
    <span
      {...props}
      className={cn("inline-block", className)}
      aria-label={props["aria-label"] ?? currentWord}
    >
      {chars.map(({ key, char, exiting }) => (
        <span
          key={key}
          className={cn("inline-block", exiting && "animate-char-fade-out")}
          onAnimationEnd={exiting ? () => handleAnimationEnd(key) : undefined}
          aria-hidden
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
      {phase === "waiting" ? null : (
        <span className="animate-blink-cursor inline-block">|</span>
      )}
    </span>
  )
}

function findLastNonExiting(chars: Char[]): number {
  for (let i = chars.length - 1; i >= 0; i--) {
    if (!chars[i]!.exiting) {
      return i
    }
  }

  return -1
}

function markLastCharExiting(chars: Char[]): Char[] {
  const idx = findLastNonExiting(chars)
  if (idx < 0) {
    return chars
  }

  return chars.map((c, i) => (i === idx ? { ...c, exiting: true } : c))
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener("change", onChange)

  return () => query.removeEventListener("change", onChange)
}

/**
 * Tracks the user's `prefers-reduced-motion` setting. The server snapshot is
 * `false` so SSR and the first client render match (avoiding hydration
 * mismatch); the real value is read on the client and updates on change.
 */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  )
}
