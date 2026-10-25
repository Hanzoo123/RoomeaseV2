import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

// Clipboard API first; the textarea fallback covers older browsers and non-secure (http) pages.
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.append(area)
    area.select()
    const copied = document.execCommand('copy')
    area.remove()
    return copied
  }
}

export default function CopyButton({ text, children, copiedMessage = 'Copied.', icon: Icon = Copy, className = 'btn btn-outline-secondary' }) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function handleClick() {
    if (!(await copyText(text))) {
      toast('Couldn’t copy. Select the text and copy it instead.', 'error')
      return
    }
    toast(copiedMessage)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {copied ? <Check size={16} aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
      {children}
    </button>
  )
}
