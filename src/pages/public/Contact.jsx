import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CircleUser, House, Link2, Mail, MessageCircle, Send, UserPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { publicUrl } from '../../config/base'
import { validateEmail } from '../../data/validation'
import { Notice } from '../../components/ui'
import { SelectField, TextArea, TextField } from '../../components/ui/form'
import PageHero from './PageHero'

export const CONTACT_TOPICS = ['A listing is wrong', 'My account', 'Listing my boarding house', 'Something else']
const LIMITS = { name: 100, email: 150, message: 5000 }
// Same idea as the PHP site's throttle: one address can't post all afternoon.
const MAX_PER_HOUR = 3
const HOUR = 60 * 60 * 1000

// Answers checked against what the app does.
const FAQS = [
  ['Is RoomEase free?', 'Yes. Searching, saving rooms and listing a boarding house cost nothing, for boarders and landlords alike.'],
  ['How long before my listing appears?', 'An administrator reviews every new listing, usually within a few days. Until then it shows as “In review” in your listings, and boarders cannot see it yet.'],
  ['Why can boarders not see my listing?', 'A listing is shown only once it has been approved. If it needs changes, the reason is written on your listing; correct it and save, and it goes back for another review.'],
  ['Can I list more than one boarding house?', 'Yes. Each boarding house is its own listing, with its own rooms, photos and reviews.'],
  ['Do I need an account to look at rooms?', 'No. Anyone can open Find Place to Stay and every listing. An account is only needed to save rooms, request a room, message a landlord or post a boarding house.'],
  ['Will you ever ask for my password?', 'Never, by email, message or phone. If you have forgotten it, use “Forgot password” on the sign-in page and a code is sent to the email on your account.'],
]

const WHAT_TO_TELL = [
  { icon: Link2, title: 'A listing that is wrong or gone', body: 'Send the link, and what is out of date.' },
  { icon: CircleUser, title: 'An account problem', body: 'The email address on the account is enough. Never send us your password; we will never ask for it.' },
  { icon: UserPlus, title: 'A landlord who wants to list', body: 'You can sign up yourself, and we review the listing within a few days.', link: { to: '/signup', state: { role: 'landlord' }, label: 'Sign up as a landlord' } },
]

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Please tell us your name.'
  else if (form.name.length > LIMITS.name) errors.name = `Keep your name under ${LIMITS.name} characters.`
  if (!validateEmail(form.email)) errors.email = 'Please give an email address we can reply to.'
  else if (form.email.length > LIMITS.email) errors.email = `Keep the email under ${LIMITS.email} characters.`
  if (form.message.trim().length < 10) errors.message = 'Please write a little more, so we know how to help.'
  else if (form.message.length > LIMITS.message) errors.message = `Keep the message under ${LIMITS.message} characters.`
  return errors
}

function ContactForm() {
  const { user } = useAuth()
  const { contactMessages, sendContactMessage } = useData()
  const toast = useToast()
  const blank = { name: user?.name ?? '', email: user?.email ?? '', topic: CONTACT_TOPICS[0], message: '', website: '' }
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')

  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setErrors(({ [key]: _cleared, ...rest }) => rest)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    setError('')
    if (Object.keys(nextErrors).length) return
    const email = form.email.trim()
    const since = new Date(Date.now() - HOUR).toISOString()
    const recent = contactMessages.filter((item) => item.email.toLowerCase() === email.toLowerCase() && item.date > since).length
    if (recent >= MAX_PER_HOUR) return setError('You have sent several messages already. Please try again in an hour.')
    // The hidden "website" field is a trap for bots: nothing is sent, and nothing says why.
    if (!form.website) sendContactMessage({ name: form.name.trim(), email, topic: form.topic, message: form.message.trim() })
    setSentTo(email)
    setForm({ ...blank, message: '' })
    toast('Thank you. Your message has been sent.')
  }

  return (
    <div id="send" className="card">
      <div className="card-body p-4 p-lg-5">
        <h2 className="h4 fw-bold tracking-tight mb-1">Send a message</h2>
        <p className="small text-body-secondary mb-4">It goes straight to the RoomEase team, and we reply to the address you give.</p>
        {sentTo && (
          <div className="mb-3">
            <Notice>Thank you. Your message has been sent, and we will reply to {sentTo}.</Notice>
          </div>
        )}
        <form onSubmit={handleSubmit} noValidate className="d-flex flex-column gap-3">
          <div className="row g-3">
            <div className="col-sm-6">
              <TextField id="contact-name" label="Your name" autoComplete="name" placeholder="Juan Dela Cruz" maxLength={LIMITS.name} value={form.name} onChange={set('name')} error={errors.name} />
            </div>
            <div className="col-sm-6">
              <TextField
                id="contact-email"
                label="Your email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                maxLength={LIMITS.email}
                value={form.email}
                onChange={set('email')}
                error={errors.email}
              />
            </div>
          </div>
          <SelectField id="contact-topic" label="What is it about?" value={form.topic} onChange={set('topic')}>
            {CONTACT_TOPICS.map((topic) => (
              <option key={topic}>{topic}</option>
            ))}
          </SelectField>
          <TextArea
            id="contact-message"
            label="Message"
            rows={5}
            placeholder="A listing that is out of date, a question about your account, or anything else"
            maxLength={LIMITS.message}
            value={form.message}
            onChange={set('message')}
            error={errors.message}
          />
          <div className="honeypot" aria-hidden="true">
            <label htmlFor="contact-website">Leave this empty</label>
            <input id="contact-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          <div>
            <button type="submit" className="btn btn-primary px-4" style={{ height: '2.75rem' }}>
              <Send size={16} aria-hidden="true" />
              Send message
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Contact() {
  const [open, setOpen] = useState(0)

  return (
    <div className="page-enter">
      <PageHero title="Contact RoomEase" lede="A listing that is no longer accurate, a question about your account, or anything else." image={publicUrl('images/pages/contact-header.webp')} />

      <section className="py-5">
        <div className="container py-lg-3">
          <div className="row g-4">
            <div className="col-lg-7">
              <ContactForm />
            </div>
            <div className="col-lg-5">
              <h2 className="h5 fw-semibold">Ways to reach us</h2>
              <p className="small text-body-secondary">Pick whichever suits you. For anything about one particular room, the landlord on that listing will answer faster than we can.</p>
              <div className="d-flex flex-column gap-3">
                <div className="card">
                  <div className="card-body d-flex gap-3">
                    <span className="icon-tile flex-shrink-0">
                      <Mail size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="fw-semibold mb-1">Email</p>
                      <p className="small text-body-secondary mb-1">For your account, a listing, or anything about the site. We answer ourselves, usually within a few days.</p>
                      <a href="mailto:hello@roomease.ph" className="small fw-medium text-decoration-none">
                        hello@roomease.ph
                      </a>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body d-flex gap-3">
                    <span className="icon-tile flex-shrink-0">
                      <House size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="fw-semibold mb-1">A question about a room</p>
                      <p className="small text-body-secondary mb-1">The landlord’s number is on every listing. For the rent, a visit or a free slot, they will answer faster than we can.</p>
                      <Link to="/rooms" className="small fw-medium text-decoration-none">
                        Find a place to stay <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body d-flex gap-3">
                    <span className="icon-tile flex-shrink-0">
                      <MessageCircle size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="fw-semibold mb-1">Already a boarder?</p>
                      <p className="small text-body-secondary mb-0">Use Messages in your dashboard to chat with a landlord about their listing.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-body border-top border-bottom">
        <div className="container py-lg-3">
          <h2 className="h4 fw-bold tracking-tight text-center mb-4">What to tell us</h2>
          <div className="row g-3">
            {WHAT_TO_TELL.map(({ icon: Icon, title, body, link }) => (
              <div key={title} className="col-md-4">
                <div className="card h-100">
                  <div className="card-body p-4">
                    <span className="icon-tile">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <h3 className="h6 fw-semibold mt-3 mb-2">{title}</h3>
                    <p className="small text-body-secondary mb-0">{body}</p>
                    {link && (
                      <Link to={link.to} state={link.state} className="d-inline-block small fw-medium text-decoration-none mt-2">
                        {link.label} <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-5">
        <div className="container py-lg-3" style={{ maxWidth: '48rem' }}>
          <h2 className="h4 fw-bold tracking-tight text-center mb-4">Questions people ask</h2>
          <div className="accordion">
            {FAQS.map(([question, answer], index) => {
              const expanded = open === index
              return (
                <div key={question} className="accordion-item">
                  <h3 className="accordion-header">
                    <button
                      type="button"
                      className={`accordion-button fw-semibold ${expanded ? '' : 'collapsed'}`}
                      aria-expanded={expanded}
                      aria-controls={`contact-faq-${index}`}
                      onClick={() => setOpen(expanded ? -1 : index)}
                    >
                      {question}
                    </button>
                  </h3>
                  <div id={`contact-faq-${index}`} className={`accordion-collapse collapse ${expanded ? 'show' : ''}`}>
                    <div className="accordion-body text-body-secondary">{answer}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
