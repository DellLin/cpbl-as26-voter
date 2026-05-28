import { addDays, differenceInMilliseconds, format, getHours, set } from 'date-fns'
import { randomInt } from 'node:crypto'

import { formatStr, targetHours } from './utils/constants.js'
import { logError, logInfo } from './utils/logger.js'
import { vote } from './vote.js'

const stopAtMs = Date.parse('2026-06-15T15:59:00Z')

function hasReachedStopTime(): boolean {
  return Date.now() >= stopAtMs
}

function getNextSchedule(): Date {
  const now = new Date()
  const hour = targetHours.find((h) => getHours(now) < h)
  const base = hour !== undefined ? now : addDays(now, 1)

  return set(base, {
    hours: hour ?? targetHours[0],
    minutes: randomInt(0, 60),
    seconds: randomInt(0, 60),
  })
}

async function runVote(): Promise<void> {
  while (true) {
    if (hasReachedStopTime()) {
      logInfo('Reached stop time (TW 2026/06/15 23:59). Scheduler stopped.')
      return
    }

    const target = getNextSchedule()
    logInfo(`Next vote is scheduled at ${format(target, formatStr)}`)

    const delay = Math.min(
      Math.max(0, differenceInMilliseconds(target, new Date())),
      Math.max(0, stopAtMs - Date.now()),
    )
    await new Promise<void>((resolve) => setTimeout(resolve, delay))

    if (hasReachedStopTime()) {
      logInfo('Reached stop time (TW 2026/06/15 23:59). Scheduler stopped.')
      return
    }

    try {
      await vote()
    } catch (error) {
      logError(`Vote failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export async function startCommand(): Promise<void> {
  if (hasReachedStopTime()) {
    logInfo('Reached stop time (TW 2026/06/15 23:59). Program exits without voting.')
    return
  }

  try {
    logInfo('Try to run vote immediately for the startup')
    await vote()
  } catch (error) {
    logError(`Vote failed: ${error instanceof Error ? error.message : String(error)}`)
  }

  logInfo('Scheduler is starting...')
  await runVote()
}
