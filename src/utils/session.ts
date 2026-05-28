import { resolve } from 'node:path'

export const sessionDir = resolve(process.env.SESSION_DIR ?? 'session')

export function resolveSessionPath(fileName: string): string {
    return resolve(sessionDir, fileName)
}