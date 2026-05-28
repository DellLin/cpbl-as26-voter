import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import axios from 'axios'

import type { Candidate, CandidatesResponse, Item } from '../types.js'
import { expectedPositions } from './constants.js'
import { logInfo } from './logger.js'
import { resolveSessionPath } from './session.js'

export const candidatesPath = resolveSessionPath('candidates.json')

export function saveCandidates(candidates: string[]): void {
  mkdirSync(dirname(candidatesPath), { recursive: true })
  writeFileSync(candidatesPath, JSON.stringify(candidates, null, 2))
}

export function readCandidates(): string[] {
  const raw = readFileSync(candidatesPath, 'utf-8')
  const candidates: string[] = JSON.parse(raw)
  if (!Array.isArray(candidates) || candidates.length !== expectedPositions.length)
    throw new Error('session/candidates.json is invalid')
  return candidates
}

export async function validateCandidates(candidates: string[]): Promise<void> {
  logInfo('Validating candidates')

  if (candidates.length !== expectedPositions.length)
    throw new Error(`Candidates length must be ${expectedPositions.length}`)

  const data = await getCandidates()
  const candidateMap = new Map(data.map((candidate) => [candidate.searchId, candidate]))

  const list: Item[] = candidates.map((searchId, index) => {
    const expected = expectedPositions[index]
    const info = candidateMap.get(searchId)

    if (!info) {
      return {
        searchId,
        isValid: false,
        position: expected,
        name: '-',
        team: '-',
        no: NaN,
        votes: NaN,
        message: 'not found',
      }
    }

    const isDuplicate = candidates.indexOf(searchId) !== index
    if (isDuplicate) {
      return {
        searchId,
        isValid: false,
        position: expected,
        name: info.name,
        team: info.team.toUpperCase(),
        no: info.no,
        votes: info.votes,
        message: 'duplicate',
      }
    }

    const { name, team, no, position, votes } = info
    const isMatch = position === expected.code

    return {
      searchId,
      isValid: isMatch,
      position: expected,
      name,
      team: team.toUpperCase(),
      no,
      votes,
      message: isMatch ? null : `actual: ${position}`,
    }
  })

  const grouped = new Map<string, Candidate[]>()
  for (const candidates of data) {
    const group = grouped.get(candidates.position)
    if (group) group.push(candidates)
    else grouped.set(candidates.position, [candidates])
  }

  const rankMap = new Map(
    [...grouped.values()].flatMap((group) =>
      group.sort((a, b) => b.votes - a.votes).map((candidates, index) => [candidates.searchId, index + 1] as const),
    ),
  )

  console.table(
    list.map((row) => ({
      ...row,
      isValid: row.isValid ? '✓' : '✗',
      position: `${row.position.label}(${row.position.code})`,
      no: isNaN(row.no) ? '-' : `#${row.no}`,
      ranking: `#${rankMap.get(row.searchId) ?? '?'}`,
      votes: (isNaN(row.votes) ? '-' : `${row.votes}`).padStart(8, ' '),
      message: row.message ?? '-',
    })),
    ['isValid', 'position', 'name', 'team', 'no', 'ranking', 'votes', 'message'],
  )

  const rows = list.filter((row) => !row.isValid)
  if (rows.length > 0) throw new Error(`There are ${rows.length} invalid candidates`)
}

export async function getCandidates(): Promise<Candidate[]> {
  const { data } = await axios.get<CandidatesResponse>('https://cpbl-server.line-apps.com/api/candidates', {
    headers: { accept: 'application/json' },
  })
  if (data.code !== 200) throw new Error(data.message || 'Failed to fetch candidates')

  return data.result
}
