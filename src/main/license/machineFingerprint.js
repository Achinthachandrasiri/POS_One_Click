import { machineIdSync } from 'node-machine-id'
import si from 'systeminformation'
import crypto from 'crypto'
import os from 'os'

export async function getMachineFingerprint() {
  const baseId = machineIdSync(true)

  const [cpu, diskLayout, baseboard] = await Promise.all([
    si.cpu(),
    si.diskLayout(),
    si.baseboard()
  ])

  const components = {
    machineId: baseId,
    cpuModel: cpu.manufacturer + '_' + cpu.brand,
    cpuCores: cpu.physicalCores,
    diskSerial: diskLayout[0]?.serialNum || 'unknown',
    boardSerial: baseboard.serial || 'unknown',
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch()
  }

  const raw = JSON.stringify(components)
  return crypto.createHash('sha256').update(raw).digest('hex')
}
