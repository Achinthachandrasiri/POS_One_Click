import crypto from 'crypto'
import { getMachineFingerprint } from './machineFingerprint'
import { checkClockIntegrity } from './clockIntegrity'

const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAQA3lquVSt125br220Mij0/ey8M1v9WoW8HbUB9dRuI0=
-----END PUBLIC KEY-----`

const publicKey = crypto.createPublicKey(PUBLIC_KEY_PEM)

export async function validateLicense(storedKey, userDataPath) {
  const clockCheck = checkClockIntegrity(userDataPath)
  if (clockCheck.tampered) {
    return { valid: false, error: 'CLOCK_TAMPERED' }
  }

  let payload
  try {
    const { data, signature } = JSON.parse(
      Buffer.from(storedKey, 'base64').toString()
    )
    const isValid = crypto.verify(
      null,
      Buffer.from(data),
      publicKey,
      Buffer.from(signature, 'base64')
    )
    if (!isValid) return { valid: false, error: 'TAMPERED' }
    payload = JSON.parse(data)
  } catch (err) {
    return { valid: false, error: 'MALFORMED' }
  }

  if (payload.type === 'dev_override') {
    if (Date.now() > payload.expiry) {
      return { valid: false, error: 'OVERRIDE_EXPIRED' }
    }
    return { valid: true, is_override: true, client_name: payload.client_name }
  }

  if (payload.expiry && Date.now() > payload.expiry) {
    return { valid: false, error: 'EXPIRED' }
  }

  const currentFingerprint = await getMachineFingerprint()

  if (!payload.machine_fingerprint) {
    return { valid: true, needs_activation: true, current_fingerprint: currentFingerprint }
  }

  if (payload.machine_fingerprint !== currentFingerprint) {
    return { valid: false, error: 'MACHINE_MISMATCH' }
  }

  return { valid: true, client_name: payload.client_name }
}
