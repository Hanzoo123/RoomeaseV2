export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

// Profile photo when the person added one, otherwise their initials.
export default function Avatar({ person, className = '' }) {
  if (person?.avatar) return <img src={person.avatar} alt="" className={`avatar avatar-photo ${className}`} />
  return (
    <span className={`avatar ${className}`} aria-hidden="true">
      {initials(person?.name)}
    </span>
  )
}
