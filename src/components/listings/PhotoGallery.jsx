import { useEffect, useRef, useState } from 'react'
import { Expand, X } from 'lucide-react'
import HouseArt from '../illustrations/HouseArt'
import RoomArt from '../illustrations/RoomArt'

const OTHER_ROOM = { single: 'desk', desk: 'single', bunk: 'single' }

// Real photos when the landlord uploaded some; otherwise three illustrated views.
function slidesFor(listing) {
  if (listing.photos?.length) return listing.photos.map((src, index) => ({ key: `photo-${index}`, src, label: `Photo ${index + 1}` }))
  return [
    { key: 'room', art: 'room', variant: listing.art.room, label: 'Room' },
    { key: 'house', art: 'house', variant: listing.art.house, label: 'Outside view' },
    { key: 'room-alt', art: 'room', variant: OTHER_ROOM[listing.art.room] ?? 'single', label: 'Another room' },
  ]
}

function Slide({ slide, alt, fit = 'cover' }) {
  if (slide.src) return <img src={slide.src} alt={alt} className="w-100 h-100" style={{ objectFit: fit }} draggable="false" />
  return slide.art === 'room' ? <RoomArt variant={slide.variant} className="w-100 h-100 d-block" /> : <HouseArt variant={slide.variant} className="w-100 h-100 d-block" />
}

// Swipe left/right on touch screens.
function useSwipe(onPrev, onNext) {
  const start = useRef(null)
  return {
    onTouchStart: (event) => {
      start.current = event.touches[0].clientX
    },
    onTouchEnd: (event) => {
      if (start.current === null) return
      const distance = event.changedTouches[0].clientX - start.current
      if (distance > 40) onPrev()
      if (distance < -40) onNext()
      start.current = null
    },
  }
}

function Controls({ onPrev, onNext }) {
  return (
    <>
      <button className="carousel-control-prev" type="button" onClick={onPrev}>
        <span className="carousel-control-prev-icon" aria-hidden="true" />
        <span className="visually-hidden">Previous photo</span>
      </button>
      <button className="carousel-control-next" type="button" onClick={onNext}>
        <span className="carousel-control-next-icon" aria-hidden="true" />
        <span className="visually-hidden">Next photo</span>
      </button>
    </>
  )
}

function Lightbox({ slides, index, setIndex, title, onClose }) {
  const prev = () => setIndex((index - 1 + slides.length) % slides.length)
  const next = () => setIndex((index + 1) % slides.length)
  const swipe = useSwipe(prev, next)
  const closeRef = useRef(null)
  const keysRef = useRef({ prev, next, onClose })

  useEffect(() => {
    keysRef.current = { prev, next, onClose }
  })

  useEffect(() => {
    closeRef.current?.focus()
    document.body.classList.add('modal-open')
    const onKeyDown = (event) => {
      if (event.key === 'Escape') keysRef.current.onClose()
      if (event.key === 'ArrowLeft') keysRef.current.prev()
      if (event.key === 'ArrowRight') keysRef.current.next()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div className="modal d-block" role="dialog" aria-modal="true" aria-label={`${title} photos`}>
      <div className="modal-dialog modal-fullscreen">
        <div className="modal-content lightbox text-white">
          <div className="d-flex align-items-center justify-content-between px-3 py-2">
            <span className="small">
              {title} · {index + 1} / {slides.length}
            </span>
            <button ref={closeRef} type="button" className="btn btn-link text-white p-2" onClick={onClose} aria-label="Close photos">
              <X size={24} />
            </button>
          </div>
          <div className="carousel slide flex-grow-1 position-relative" {...swipe}>
            <div className="carousel-inner h-100">
              <div key={slides[index].key} className="carousel-item active h-100 slide-in">
                <div className="h-100 d-flex align-items-center justify-content-center p-3 p-md-5">
                  <div className="lightbox-frame">
                    <Slide slide={slides[index]} alt={`${title}: ${slides[index].label}`} fit="contain" />
                  </div>
                </div>
              </div>
            </div>
            {slides.length > 1 && <Controls onPrev={prev} onNext={next} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// Bootstrap carousel driven by React state (no bootstrap.js), with thumbnails and a full-screen view.
export default function PhotoGallery({ listing }) {
  const slides = slidesFor(listing)
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const active = Math.min(index, slides.length - 1)

  const prev = () => setIndex((active - 1 + slides.length) % slides.length)
  const next = () => setIndex((active + 1) % slides.length)
  const swipe = useSwipe(prev, next)

  return (
    <div>
      <div
        className="carousel slide rounded-4 overflow-hidden position-relative"
        aria-roledescription="carousel"
        aria-label={`${listing.name} photos`}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') prev()
          if (event.key === 'ArrowRight') next()
        }}
        {...swipe}
      >
        {slides.length > 1 && (
          <div className="carousel-indicators mb-2">
            {slides.map((slide, position) => (
              <button
                key={slide.key}
                type="button"
                className={position === active ? 'active' : ''}
                aria-current={position === active}
                aria-label={`Show ${slide.label.toLowerCase()}`}
                onClick={() => setIndex(position)}
              />
            ))}
          </div>
        )}
        <div className="carousel-inner">
          <div key={slides[active].key} className="carousel-item active slide-in" aria-roledescription="slide" aria-label={`${active + 1} of ${slides.length}`}>
            <div className="ratio ratio-16x9">
              <Slide slide={slides[active]} alt={`${listing.name}: ${slides[active].label}`} />
            </div>
          </div>
        </div>
        {slides.length > 1 && <Controls onPrev={prev} onNext={next} />}
        <button type="button" className="btn btn-sm btn-dark bg-opacity-75 position-absolute top-0 end-0 m-3 z-3" onClick={() => setExpanded(true)}>
          <Expand size={14} aria-hidden="true" />
          View photos
        </button>
        <span className="badge text-bg-dark bg-opacity-75 position-absolute top-0 start-0 m-3 z-3">
          {active + 1} / {slides.length}
        </span>
      </div>

      {slides.length > 1 && (
        <div className="d-flex gap-2 mt-3 overflow-x-auto pb-1">
          {slides.map((slide, position) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => setIndex(position)}
              aria-label={`Show ${slide.label.toLowerCase()}`}
              aria-pressed={position === active}
              className={`btn d-block p-0 border-2 rounded-3 overflow-hidden flex-shrink-0 ${position === active ? 'border-primary' : 'border-transparent opacity-75'}`}
              style={{ width: '6.5rem' }}
            >
              <div className="ratio" style={{ '--bs-aspect-ratio': '62.5%' }}>
                <Slide slide={slide} alt="" />
              </div>
            </button>
          ))}
        </div>
      )}

      {expanded && <Lightbox slides={slides} index={active} setIndex={setIndex} title={listing.name} onClose={() => setExpanded(false)} />}
    </div>
  )
}
