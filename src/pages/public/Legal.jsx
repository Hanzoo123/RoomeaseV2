import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import PageHero from './PageHero'

// Adapted from the PHP version's legal pages to what this app stores and does.
// Update the date when the wording changes.
const UPDATED = 'October 25, 2026'

function Privacy() {
  return (
    <>
      <p>
        This policy explains the personal information RoomEase keeps and how it is used. RoomEase aims to handle it in line with the Data Privacy Act of 2012 (Republic Act No. 10173). Using
        RoomEase also means agreeing to our <Link to="/terms">Terms &amp; Conditions</Link>.
      </p>

      <h2>What we keep</h2>
      <ul>
        <li>Account details: your name, email address, phone number if you give one, profile photo if you add one, and whether you are a boarder or a landlord.</li>
        <li>Your password. Nobody at RoomEase asks for it or can see it in the admin panel.</li>
        <li>Listings, for landlords: the boarding house name, address, map pin, description, house rules, stay terms, bills included, rooms, rent and photos.</li>
        <li>Saved rooms, recently viewed rooms and rooms picked for comparison, for boarders.</li>
        <li>Room requests: the room asked for, the move-in date, the note to the landlord, and the landlord’s answer, with any reason they give.</li>
        <li>Messages between a boarder and a landlord about a listing, and reviews written after an approved stay.</li>
        <li>Messages sent through the contact form: your name, email, topic and message.</li>
        <li>An activity log of moderation and account actions (for example, a listing approved or an account deactivated), so administrators can see who changed what and when.</li>
      </ul>

      <h2>Your location</h2>
      <ul>
        <li>“Near me” and “Show my location” ask your browser for your position only when you tap them.</li>
        <li>The position is used on your device to measure distances and is forgotten when you close the tab. It is not sent to RoomEase or to landlords.</li>
      </ul>

      <h2>Sign-in and browser storage</h2>
      <ul>
        <li>Your browser keeps you signed in while you use the site. If you tick “Remember me”, this device stays signed in until you log out.</li>
        <li>Your theme (light or dark) is remembered on this device.</li>
        <li>RoomEase uses no advertising or tracking cookies.</li>
      </ul>

      <h2>How it is used</h2>
      <ul>
        <li>To run your account and sign you in.</li>
        <li>To show approved listings to people looking for a room.</li>
        <li>To give you a code when you ask to reset your password.</li>
        <li>To review listings, answer contact messages and keep the site safe.</li>
      </ul>
      <p>RoomEase does not sell your information or use it for advertising.</p>

      <h2>Who can see it</h2>
      <ul>
        <li>Anyone visiting RoomEase can see approved listings, including the landlord’s name, phone number, and the listing’s address and map pin.</li>
        <li>Administrators can see account details and all listings, to review and manage the site.</li>
        <li>Your saved rooms are not shown to anyone else.</li>
        <li>When you request a room or message a landlord, that landlord sees your name, email address, phone number if you gave one, and what you wrote.</li>
        <li>OpenStreetMap supplies the map images and receives your IP address when they load, as any website does when you load its images.</li>
      </ul>

      <h2>How long it is kept</h2>
      <p>
        Account and listing details are kept while your account exists. A listing an administrator takes down is hidden from boarders but kept, so it can be restored if it was removed by mistake.
        Password reset codes stop working after 10 minutes.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Change your name, email address, phone number and photo on your profile at any time.</li>
        <li>Landlords can edit or delete their own listings.</li>
        <li>
          To have your account removed, or to ask what information RoomEase holds about you, <Link to="/contact">contact the RoomEase team</Link>.
        </li>
      </ul>

      <h2>Changes to this policy</h2>
      <p>This policy may be updated. The date at the top shows when it last changed.</p>
    </>
  )
}

function Terms() {
  return (
    <>
      <p>
        RoomEase is a web-based boarding house information and listing system for Baybay City, Leyte. It helps boarders find rooms and landlords list them. By creating an account or signing in,
        you agree to these terms and to our <Link to="/privacy">Privacy Policy</Link>.
      </p>

      <h2>What RoomEase does, and does not do</h2>
      <ul>
        <li>RoomEase shows boarding houses, their rooms, rent, house rules and how to contact the landlord.</li>
        <li>A boarder can request a room, and its landlord accepts or declines the request. An accepted request is not a rental contract: the move-in is still arranged between you and the landlord.</li>
        <li>RoomEase does not rent out rooms or handle payments. Any reservation fee, deposit or rent is agreed and paid between you and the landlord directly.</li>
        <li>RoomEase is not a party to any agreement between a boarder and a landlord.</li>
      </ul>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate details and keep them up to date.</li>
        <li>Keep your password to yourself. You are responsible for what happens on your account.</li>
        <li>Use your own account only, with the role that fits you: boarder or landlord.</li>
      </ul>

      <h2>Landlords and listings</h2>
      <ul>
        <li>Only list boarding houses in Baybay City that you own or are allowed to rent out.</li>
        <li>Keep rent, rooms, open slots, house rules, photos and contact details accurate and current.</li>
        <li>Only upload photos of the actual property that you have the right to use.</li>
        <li>An administrator reviews each new listing before boarders can see it, and may ask for changes, reject or remove a listing that breaks these terms.</li>
      </ul>

      <h2>Boarders</h2>
      <ul>
        <li>Visit the room and confirm the terms with the landlord before paying anything.</li>
        <li>Use a landlord’s contact details only to ask about their listing.</li>
        <li>Write reviews only about places you stayed in, and keep them honest and respectful.</li>
      </ul>

      <h2>Not allowed</h2>
      <ul>
        <li>False or misleading listings, fake accounts, or pretending to be someone else.</li>
        <li>Harassment, spam, or collecting other people’s details from the site.</li>
        <li>Trying to break into, overload, or get around the security of RoomEase.</li>
      </ul>

      <h2>When the rules are broken</h2>
      <p>An administrator may reject or remove listings, and deactivate accounts, that break these terms.</p>

      <h2>No guarantees</h2>
      <ul>
        <li>Landlords write their own listings. RoomEase reviews them, but cannot promise every detail is correct or that a room is still free.</li>
        <li>The site is provided as it is and may sometimes be unavailable, for example during maintenance. Maps need an internet connection.</li>
        <li>RoomEase is not responsible for losses that come from dealings between boarders and landlords.</li>
      </ul>

      <h2>Changes to these terms</h2>
      <p>These terms may be updated. The date at the top shows when they last changed, and using RoomEase after that means you accept the new version.</p>

      <h2>Questions</h2>
      <p>
        If anything here is unclear, <Link to="/contact">contact the RoomEase team</Link>.
      </p>
    </>
  )
}

const PAGES = {
  privacy: { title: 'Privacy Policy', lede: 'What RoomEase keeps about you, why, and who can see it.', Body: Privacy },
  terms: { title: 'Terms & Conditions', lede: 'The rules for using RoomEase, in plain language.', Body: Terms },
}

export default function Legal({ page }) {
  const { title, lede, Body } = PAGES[page]
  return (
    <div className="page-enter">
      <PageHero title={title} lede={lede} />
      <section className="py-5">
        <div className="container" style={{ maxWidth: '48rem' }}>
          <p className="small text-body-secondary">Last updated {UPDATED}</p>
          <div className="alert alert-primary d-flex gap-2 small">
            <Info size={16} className="flex-shrink-0 mt-1" aria-hidden="true" />
            <span>This version of RoomEase is a demo: everything you enter is saved in this browser only, not on a server, and no email or SMS is sent.</span>
          </div>
          <article className="legal-body">
            <Body />
          </article>
          <p className="small text-body-secondary border-top pt-4 mt-5 mb-0">
            See also: {page === 'privacy' ? <Link to="/terms">Terms &amp; Conditions</Link> : <Link to="/privacy">Privacy Policy</Link>} · <Link to="/contact">Contact us</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
