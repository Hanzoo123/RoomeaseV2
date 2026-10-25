import { CalendarRange, Clock, CookingPot, ListChecks, PawPrint, Receipt, UserCheck, Users, Wallet } from 'lucide-react'
import { GENDER_POLICIES } from '../../data/mockData'

const yesNo = (value, yes, no) => (value ? yes : no)

// Stay terms set by the landlord in the listing form.
export default function LivingHere({ listing, title = 'Living here' }) {
  const terms = [
    { icon: Users, label: 'Who can stay', value: GENDER_POLICIES[listing.genderPolicy] ?? 'Anyone' },
    { icon: Clock, label: 'Curfew', value: listing.curfew || 'No curfew' },
    { icon: CalendarRange, label: 'Minimum stay', value: listing.minimumStayMonths ? `${listing.minimumStayMonths} ${listing.minimumStayMonths === 1 ? 'month' : 'months'}` : 'No minimum' },
    { icon: UserCheck, label: 'Visitors', value: yesNo(listing.visitorsAllowed, 'Allowed', 'Not allowed') },
    { icon: CookingPot, label: 'Cooking', value: yesNo(listing.cookingAllowed, 'Allowed', 'Not allowed') },
    { icon: PawPrint, label: 'Pets', value: yesNo(listing.petsAllowed, 'Allowed', 'Not allowed') },
    { icon: Wallet, label: 'Pay by', value: listing.paymentMethods.length ? listing.paymentMethods.join(', ') : 'Ask the landlord' },
  ]

  return (
    <section className="card">
      <div className="card-body p-4">
        <h2 className="h5 fw-semibold mb-3">{title}</h2>
        <dl className="row g-2 mb-0">
          {terms.map(({ icon: Icon, label, value }) => (
            <div key={label} className="col-6 col-md-4">
              <div className="fact-tile h-100 d-flex gap-2">
                <Icon size={16} className="text-primary flex-shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <dt className="text-xs fw-normal text-body-secondary">{label}</dt>
                  <dd className="small fw-semibold mb-0">{value}</dd>
                </div>
              </div>
            </div>
          ))}
        </dl>

        <div className="row g-4 mt-1">
          <div className="col-md-6">
            <h3 className="d-flex align-items-center gap-2 fs-6 fw-semibold mb-2">
              <Receipt size={16} className="text-primary" aria-hidden="true" />
              What’s included
            </h3>
            {listing.utilities.length ? (
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                {listing.utilities.map((utility) => (
                  <li key={utility.name} className="d-flex justify-content-between gap-3 border-bottom pb-2">
                    <span>{utility.name}</span>
                    <span className="text-body-secondary text-end">{utility.billing || 'Included'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small text-body-secondary mb-0">The landlord hasn’t listed which bills are included.</p>
            )}
          </div>
          <div className="col-md-6">
            <h3 className="d-flex align-items-center gap-2 fs-6 fw-semibold mb-2">
              <ListChecks size={16} className="text-primary" aria-hidden="true" />
              House rules
            </h3>
            {listing.houseRules.length ? (
              <ul className="small ps-3 d-flex flex-column gap-1 mb-0">
                {listing.houseRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            ) : (
              <p className="small text-body-secondary mb-0">No house rules listed yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
