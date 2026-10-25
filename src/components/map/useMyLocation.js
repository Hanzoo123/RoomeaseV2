import { useCallback, useState } from 'react'
import { useToast } from '../../context/ToastContext'

const LOCATION_KEY = 'roomease.myLocation'

function readSaved() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(LOCATION_KEY))
    return Array.isArray(saved) && saved.length === 2 ? saved : null
  } catch {
    return null
  }
}

const ERRORS = {
  1: 'Location is blocked for this site. Allow it in your browser settings to find rooms near you.',
  2: 'Your location couldn’t be found. Check that location services are on.',
  3: 'Finding your location took too long. Try again.',
}

// The visitor's position for "Near me". Kept for this tab only, never sent anywhere.
export default function useMyLocation() {
  const [position, setPosition] = useState(readSaved)
  const [locating, setLocating] = useState(false)
  const toast = useToast()

  const locate = useCallback(
    (onFound) => {
      if (!navigator.geolocation) {
        toast('This browser can’t share your location.', 'error')
        return
      }
      setLocating(true)
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const next = [Number(coords.latitude.toFixed(5)), Number(coords.longitude.toFixed(5))]
          try {
            sessionStorage.setItem(LOCATION_KEY, JSON.stringify(next))
          } catch {
            // The position still works until the page is reloaded.
          }
          setPosition(next)
          setLocating(false)
          onFound?.(next)
        },
        (error) => {
          setLocating(false)
          toast(ERRORS[error.code] ?? ERRORS[2], 'error')
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
      )
    },
    [toast],
  )

  return { position, locating, locate }
}
