import fs from 'fs'
import path from 'path'

const BUFFER_MS = 5 * 60 * 1000

function getClockStatePath(userDataPath) {
  return path.join(userDataPath, 'clock_state.json')
}

export function checkClockIntegrity(userDataPath) {
  const clockPath = getClockStatePath(userDataPath)
  const now = Date.now()

  let lastSeen = 0
  try {
    const stored = JSON.parse(fs.readFileSync(clockPath, 'utf-8'))
    lastSeen = stored.last_seen || 0
  } catch (err) {
    // no file yet — first run, nothing to compare
  }

  if (now < lastSeen - BUFFER_MS) {
    return { tampered: true, last_seen: lastSeen, current_time: now }
  }

  fs.writeFileSync(clockPath, JSON.stringify({ last_seen: Math.max(now, lastSeen) }))
  return { tampered: false }
}
