import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { newId } from '../data/storage'

// Short confirmation messages using Bootstrap toasts, shown top-right and auto-dismissed.
const ToastContext = createContext(null)
const DURATION = 3500

const TONES = {
  success: { icon: CircleCheck, className: 'text-success' },
  error: { icon: CircleAlert, className: 'text-danger' },
  info: { icon: Info, className: 'text-primary' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((current) => current.filter((item) => item.id !== id)), [])

  const toast = useCallback(
    (message, tone = 'success') => {
      const id = newId('t')
      setToasts((current) => [...current.slice(-2), { id, message, tone }])
      setTimeout(() => dismiss(id), DURATION)
    },
    [dismiss],
  )

  // DataContext dispatches this when localStorage refuses a save (usually too many photos).
  useEffect(() => {
    const onStorageFull = () => toast('Browser storage is full, so your last change wasn’t saved. Try removing some photos.', 'error')
    window.addEventListener('roomease:storage-full', onStorageFull)
    return () => window.removeEventListener('roomease:storage-full', onStorageFull)
  }, [toast])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container position-fixed toast-stack p-3">
        {toasts.map(({ id, message, tone }) => {
          const { icon: Icon, className } = TONES[tone] ?? TONES.info
          return (
            <div key={id} className="toast show toast-enter border-0 shadow" role={tone === 'error' ? 'alert' : 'status'} aria-live={tone === 'error' ? 'assertive' : 'polite'}>
              <div className="d-flex align-items-start">
                <div className="toast-body d-flex align-items-start gap-2 small">
                  <Icon size={18} className={`flex-shrink-0 ${className}`} aria-hidden="true" />
                  <span>{message}</span>
                </div>
                <button type="button" className="btn-close me-2 mt-2 flex-shrink-0" onClick={() => dismiss(id)} aria-label="Close" />
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
