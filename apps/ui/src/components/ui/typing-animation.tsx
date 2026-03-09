"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { cn } from "@/lib/styles"

interface Char {
  key: number
  char: string
  exiting: boolean
}

interface TypingAnimationProps {
  words: string[]
  className?: string
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
}: TypingAnimationProps) {
  const initialChars = useMemo(
    () =>
      startTyped
        ? Array.from(words[0] ?? "").map((char, index) => ({
            key: index,
            char,
            exiting: false,
          }))
        : [],
    [startTyped, words]
  )
  const [wordIndex, setWordIndex] = useState(0)
  const [phase, setPhase] = useState<"waiting" | "typing" | "deleting">(
    startTyped && startDelay > 0 ? "waiting" : "typing"
  )
  const [chars, setChars] = useState<Char[]>(initialChars)
  const nextKey = useRef(initialChars.length)
  const typingIndex = useRef(startTyped ? initialChars.length : 0)

  const currentWord = words[wordIndex] ?? ""
  const graphemes = useMemo(() => Array.from(currentWord), [currentWord])

  useEffect(() => {
    if (phase !== "waiting") {
      return
    }

    const timeout = setTimeout(() => {
      setPhase("deleting")
    }, startDelay)

    return () => clearTimeout(timeout)
  }, [phase, startDelay])

  // Reset typing cursor when word changes
  useEffect(() => {
    typingIndex.current = 0
  }, [wordIndex])

  // Typing: add one character at a time
  useEffect(() => {
    if (phase !== "typing") {
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
  }, [phase, chars.length, graphemes, typeSpeed, pauseDelay])

  // Deleting: mark characters for exit on a steady interval
  useEffect(() => {
    if (phase !== "deleting") {
      return
    }

    const interval = setInterval(() => {
      setChars((prev) => {
        const idx = findLastNonExiting(prev)
        if (idx < 0) {
          return prev
        }

        return prev.map((c, i) => (i === idx ? { ...c, exiting: true } : c))
      })
    }, deleteSpeed)

    return () => clearInterval(interval)
  }, [phase, deleteSpeed])

  // Remove character from DOM when its exit animation finishes
  const handleAnimationEnd = useCallback(
    (key: number) => {
      let isEmpty = false

      setChars((prev) => {
        const next = prev.filter((c) => c.key !== key)
        isEmpty = next.length === 0

        return next
      })

      if (isEmpty) {
        setWordIndex((i) => (i + 1) % words.length)
        setPhase("typing")
      }
    },
    [words.length]
  )

  return (
    <span className={cn("inline-block", className)} aria-label={currentWord}>
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
