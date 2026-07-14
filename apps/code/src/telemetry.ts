import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const TELEMETRY_URL = 'https://tera-api-v01.netlify.app/v1/telemetry/ping'
const INSTANCE_FILE = join(homedir(), '.codra', 'instance-id')
const PINGED_FILE = join(homedir(), '.codra', 'last-pinged')

function getInstanceId(): string {
  if (existsSync(INSTANCE_FILE)) {
    return readFileSync(INSTANCE_FILE, 'utf-8').trim()
  }
  const id = randomUUID()
  const dir = join(homedir(), '.codra')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(INSTANCE_FILE, id)
  return id
}

function shouldPing(): boolean {
  const today = new Date().toISOString().slice(0, 10)
  if (existsSync(PINGED_FILE)) {
    const last = readFileSync(PINGED_FILE, 'utf-8').trim()
    if (last === today) return false
  }
  const dir = join(homedir(), '.codra')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(PINGED_FILE, today)
  return true
}

export function ping(): void {
  if (!shouldPing()) return

  const instanceId = getInstanceId()
  const payload = {
    instance_id: instanceId,
    version: '0.2.5',
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    ts: new Date().toISOString(),
  }

  fetch(TELEMETRY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // silent — telemetry must never block or alert
  })
}
