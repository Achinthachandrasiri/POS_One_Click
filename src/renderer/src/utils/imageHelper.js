export const toImageSrc = (imagePath) => {
  if (!imagePath) return null

  if (imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
    return imagePath
  }

  if (imagePath.startsWith('safe-file://')) {
    return imagePath
  }

  const normalized = imagePath.replace(/\\/g, '/')

  const encoded = normalized
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  const result = `safe-file:///${encoded}`

  console.log('[toImageSrc] input:', imagePath)
  console.log('[toImageSrc] output:', result)

  return result
}
