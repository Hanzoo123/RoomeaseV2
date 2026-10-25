import { Link } from 'react-router-dom'
import { ArrowLeft, SearchX } from 'lucide-react'
import { EmptyState } from '../components/ui'

export default function NotFound({ role }) {
  return (
    <EmptyState
      icon={SearchX}
      title="Page not found"
      body="The page you’re looking for doesn’t exist or has moved."
      action={
        <Link to={`/${role}`} className="btn btn-primary">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to dashboard
        </Link>
      }
    />
  )
}
