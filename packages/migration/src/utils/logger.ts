import chalk from "chalk"

export interface Logger {
  info: (msg: string) => void
  success: (msg: string) => void
  warn: (msg: string) => void
  error: (msg: string, err?: unknown) => void
  debug: (msg: string) => void
  header: (msg: string) => void
  divider: () => void
  progress: (current: number, total: number, msg: string) => void
}

export function createLogger(verbose = false): Logger {
  return {
    info: (msg) => console.log(chalk.blue("  ℹ"), msg),

    success: (msg) => console.log(chalk.green("  ✓"), msg),

    warn: (msg) => console.log(chalk.yellow("  ⚠"), msg),

    error: (msg, err?) => {
      console.error(chalk.red("  ✗"), msg)
      if (err && verbose) {
        console.error(err)
      }
    },

    debug: (msg) => {
      if (verbose) {
        console.log(chalk.gray("  ·"), chalk.gray(msg))
      }
    },

    header: (msg) => {
      console.log()
      console.log(chalk.bold.cyan(`  ─── ${msg} ───`))
      console.log()
    },

    divider: () => {
      console.log(chalk.gray("  " + "─".repeat(50)))
    },

    progress: (current, total, msg) => {
      const pct = Math.round((current / total) * 100)
      const counter = chalk.gray(`[${current}/${total}]`)
      const bar = renderBar(pct)
      console.log(`  ${counter} ${bar} ${msg}`)
    },
  }
}

function renderBar(pct: number): string {
  const width = 20
  const filled = Math.round((pct / 100) * width)
  const empty = width - filled
  const bar = chalk.green("█".repeat(filled)) + chalk.gray("░".repeat(empty))

  return `${bar} ${chalk.gray(`${pct}%`)}`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`

  const mins = Math.floor(ms / 60_000)
  const secs = Math.round((ms % 60_000) / 1000)

  return `${mins}m ${secs}s`
}
