// Full-width photo header used by About, Contact and the legal pages.
export default function PageHero({ title, lede, image, children }) {
  return (
    <header className="page-hero">
      {image && <img src={image} alt="" />}
      <div className="container py-5">
        <div className="py-lg-4" style={{ maxWidth: '40rem' }}>
          <h1 className="display-5 fw-bold tracking-tight">{title}</h1>
          {lede && <p className="lead text-white text-opacity-75 mt-3 mb-0">{lede}</p>}
          {children}
        </div>
      </div>
    </header>
  )
}
