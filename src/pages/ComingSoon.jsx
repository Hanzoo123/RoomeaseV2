import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, Construction } from 'lucide-react'
import { NAVIGATION } from '../config/navigation'

// Placeholder for sidebar pages that are planned but not built yet.
export default function ComingSoon({ role }) {
  const { section } = useParams()
  const { search } = useLocation()
  const page = NAVIGATION[role].find((item) => item.to === `/${role}/${section}`)
  const query = new URLSearchParams(search).get('q')

  return (
    <div className="card mx-auto mt-6 max-w-xl px-6 py-12 text-center sm:px-10">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Construction className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-xl font-bold tracking-tight">{page?.label ?? 'Page not found'}</h1>
      <p className="mt-2 text-sm text-muted">
        {page
          ? 'This page is planned for the next build phase. The dashboard and sign-in are ready to use now.'
          : 'We couldn’t find the page you were looking for.'}
      </p>
      {query && (
        <p className="mt-3 text-sm">
          You searched for <strong>“{query}”</strong>.
        </p>
      )}
      <Link to={`/${role}`} className="btn-primary mt-6">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to dashboard
      </Link>
    </div>
  )
}
