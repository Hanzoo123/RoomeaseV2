import { useState } from 'react'
import { Modal } from '../ui'
import { TextArea } from '../ui/form'

// Asks for the reason behind a rejection, removal or deactivation. The person affected sees it.
export default function ReasonDialog({ title, intro, label = 'Reason', suggestions = [], confirmLabel, confirmClass = 'btn-danger', required = true, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  function confirm() {
    const text = reason.trim()
    if (required && text.length < 10) {
      setError('Write at least a short sentence, so they know what to fix.')
      return
    }
    onConfirm(text)
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={`btn ${confirmClass}`} onClick={confirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      {intro && <p className="small text-body-secondary">{intro}</p>}
      {suggestions.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-3" aria-label="Common reasons">
          {suggestions.map((text) => (
            <button
              key={text}
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill text-start"
              onClick={() => {
                setReason(text)
                setError('')
              }}
            >
              {text}
            </button>
          ))}
        </div>
      )}
      <TextArea
        id="reason"
        label={required ? label : `${label} (optional)`}
        rows={3}
        maxLength={500}
        value={reason}
        onChange={(event) => {
          setReason(event.target.value)
          setError('')
        }}
        error={error}
      />
    </Modal>
  )
}
