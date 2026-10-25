import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BAYBAY_CENTER } from '../../data/mockData'

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)

// Leaflet map with labelled pins. `markers`: [{ id, coords: [lat, lng], label, active }].
// Pins are HTML (L.divIcon), so they render even if map tiles can't load.
export default function MapView({ markers = [], onMarkerClick, onMapClick, center = BAYBAY_CENTER, zoom = 14, fit = true, className = '', style, label = 'Map' }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const handlersRef = useRef({ onMarkerClick, onMapClick })
  const fittedKey = useRef('')
  const fitView = useRef(null)
  const userMoved = useRef(false)
  const [tilesFailed, setTilesFailed] = useState(false)

  useEffect(() => {
    handlersRef.current = { onMarkerClick, onMapClick }
  })

  useEffect(() => {
    const map = L.map(containerRef.current, { center, zoom, scrollWheelZoom: false, zoomControl: true })
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION })
      .on('tileerror', () => setTilesFailed(true))
      .on('tileload', () => setTilesFailed(false))
      .addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    map.on('click', (event) => handlersRef.current.onMapClick?.([event.latlng.lat, event.latlng.lng]))
    map.on('dragstart', () => {
      userMoved.current = true
    })
    mapRef.current = map

    // Keep the map sized correctly when its container appears or resizes, and re-fit
    // the pins (a fit done before layout settles can leave pins outside the view).
    const observer = new ResizeObserver(() => {
      map.invalidateSize()
      if (!userMoved.current) fitView.current?.()
    })
    observer.observe(containerRef.current)
    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      fittedKey.current = ''
      userMoved.current = false
    }
    // The map is created once; center/zoom changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    for (const marker of markers) {
      const icon = L.divIcon({
        className: 'map-pin-anchor',
        html: `<span class="map-pin${marker.active ? ' active' : ''}">${escapeHtml(marker.label)}</span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })
      L.marker(marker.coords, { icon, title: marker.title ?? marker.label, keyboard: true, zIndexOffset: marker.active ? 1000 : 0 })
        .on('click', () => handlersRef.current.onMarkerClick?.(marker.id))
        .addTo(layer)
    }

    // Re-fit only when the set of pins changes, not when one is highlighted.
    const key = markers.map((marker) => `${marker.id}:${marker.coords}`).join('|')
    if (fit && key !== fittedKey.current && markers.length) {
      fittedKey.current = key
      const coords = markers.map((marker) => marker.coords)
      fitView.current = () => {
        if (coords.length === 1) map.setView(coords[0], Math.max(map.getZoom(), 15))
        else map.fitBounds(L.latLngBounds(coords), { padding: [48, 48], maxZoom: 15 })
      }
      fitView.current()
    }
  }, [markers, fit])

  useEffect(() => {
    if (!fit && mapRef.current) mapRef.current.setView(center, mapRef.current.getZoom())
    // Only react to a new center value, not to array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit, center[0], center[1]])

  return (
    <div className={`map-shell position-relative ${className}`} style={style}>
      <div ref={containerRef} className="map-canvas" role="region" aria-label={label} />
      {tilesFailed && (
        <div className="map-offline small">Map images couldn’t load. Check your internet connection. Pins still show each location.</div>
      )}
    </div>
  )
}
