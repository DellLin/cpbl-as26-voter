import { startCommand } from './scheduler.js'
import { logError, logInfo } from './utils/logger.js'

async function main(): Promise<void> {
  logInfo('Start mode only (non-interactive).')
  await startCommand()
}

main().catch((error) => {
  logError(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
