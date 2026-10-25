// Shrinks an uploaded photo so several fit comfortably in localStorage.
// `square` center-crops it first (used for profile photos).
export function resizeImage(file, maxSize = 1024, { square = false, quality = 0.72 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const image = new Image()
      image.onerror = reject
      image.onload = () => {
        const side = Math.min(image.width, image.height)
        const crop = square ? { x: (image.width - side) / 2, y: (image.height - side) / 2, width: side, height: side } : { x: 0, y: 0, width: image.width, height: image.height }
        const scale = Math.min(1, maxSize / Math.max(crop.width, crop.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(crop.width * scale)
        canvas.height = Math.round(crop.height * scale)
        canvas.getContext('2d').drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
