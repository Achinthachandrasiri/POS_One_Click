const DEVICE_ID_KEY = 'alpa_pos_device_id'

export const getDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}
