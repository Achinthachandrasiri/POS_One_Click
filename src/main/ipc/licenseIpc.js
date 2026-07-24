import { ipcMain, app } from 'electron'
import fs from 'fs'
import path from 'path'
import { validateLicense } from '../license/validateLicense'
import { getMachineFingerprint } from '../license/machineFingerprint'

function getLicenseFilePath() {
  return path.join(app.getPath('userData'), 'license.dat')
}

async function checkStoredLicense() {
  try {
    const stored = JSON.parse(fs.readFileSync(getLicenseFilePath(), 'utf-8'))
    const result = await validateLicense(stored.original_key, app.getPath('userData'))

    if (!result.valid) return { success: false, error: result.error }

    if (!result.is_override) {
      const currentFingerprint = await getMachineFingerprint()
      if (stored.bound_fingerprint !== currentFingerprint) {
        return { success: false, error: 'MACHINE_MISMATCH' }
      }
    }

    return { success: true, client_name: result.client_name }
  } catch (err) {
    return { success: false, error: 'NOT_ACTIVATED' }
  }
}

export const registerLicenseIpc = () => {
  ipcMain.handle('license:activate', async (event, enteredKey) => {
    const result = await validateLicense(enteredKey, app.getPath('userData'))

    if (!result.valid) {
      return { success: false, error: result.error }
    }

    const activationRecord = {
      original_key: enteredKey,
      bound_fingerprint: result.needs_activation ? result.current_fingerprint : null,
      activated_at: Date.now()
    }

    fs.writeFileSync(getLicenseFilePath(), JSON.stringify(activationRecord))
    return { success: true }
  })

  ipcMain.handle('license:check', async () => {
    return checkStoredLicense()
  })
}
