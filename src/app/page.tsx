import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/Footer'

const CORNER_CARDS = [
  { title: 'New Farmer Registration', desc: 'Create your account to access all government schemes', href: '/register', accent: true },
  { title: 'Upload Documents', desc: 'Submit land records, Aadhaar, bank passbook for verification', href: '/upload', accent: false },
  { title: 'Track Application Status', desc: 'View the status of your submitted documents and applications', href: '/dashboard', accent: false },
  { title: 'Notifications & Alerts', desc: 'Check updates, approvals and scheme recommendations', href: '/notifications', accent: false },
]

const STATS = [
  { label: 'Registered Farmers', value: '12,48,532' },
  { label: 'Schemes Available', value: '24' },
  { label: 'Documents Verified', value: '8,94,210' },
  { label: 'Benefits Disbursed', value: 'Rs. 2,840 Cr' },
]

const REQUIRED_DOCS = [
  'Land Record / Khatoni',
  'Aadhaar Card (both sides)',
  'Bank Passbook / Cancelled Cheque',
  'Income Certificate',
  'Caste Certificate (if applicable)',
  'Passport Size Photograph',
]

export default function HomePage() {
  return (
    <div className="page-wrapper">
      <Header />

      <main>
        {/* Stats */}
        <div className="stats-strip">
          <div className="content-area stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="stat-box">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Notice */}
        <div className="notice-bar">
          <div className="content-area">
            <p>
              <strong>Important:</strong> eKYC is MANDATORY for all registered farmers. OTP-based eKYC is available on this portal.
            </p>
          </div>
        </div>

        {/* Main */}
        <div className="content-area main-grid">

          {/* LEFT */}
          <div className="left-col">

            {/* Farmer Corner */}
            <div className="section-box">
              <div className="section-heading">Farmer's Corner</div>

              <div className="corner-grid">
                {CORNER_CARDS.map((card) => (
                  <Link
                    key={card.title}
                    href={card.href}
                    className={`corner-card ${card.accent ? 'accent' : ''}`}
                  >
                    <div className="corner-title">{card.title}</div>
                    <div className="corner-desc">{card.desc}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div className="section-box">
              <div className="section-heading">How It Works</div>

              <div className="steps-grid">
                {[
                  { num: '01', title: 'Register', desc: 'Create your farmer account' },
                  { num: '02', title: 'Upload', desc: 'Submit documents' },
                  { num: '03', title: 'Verify', desc: 'System verifies records' },
                  { num: '04', title: 'Apply', desc: 'Get scheme benefits' },
                ].map((step) => (
                  <div key={step.num} className="step-box">
                    <div className="step-num">{step.num}</div>
                    <div className="step-title">{step.title}</div>
                    <div className="step-desc">{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT */}
          <div className="right-col">

            {/* Login */}
            <div className="section-box">
              <div className="section-heading">Farmer Login</div>

              <div className="sidebar-box">
                <p>Login to access dashboard and track applications.</p>

                <Link href="/login" className="btn-primary full">
                  Login to Portal
                </Link>

                <Link href="/register" className="btn-outline full">
                  New Registration
                </Link>
              </div>
            </div>

            {/* Documents */}
            <div className="section-box">
              <div className="section-heading">Required Documents</div>

              <ul className="clean-list">
                {REQUIRED_DOCS.map((doc) => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            </div>

            {/* Helpline */}
            <div className="helpline-box">
              <div className="help-title">Helpline</div>
              <div className="help-number">1800-XXX-XXXX</div>
              <div className="help-sub">Toll Free (9 AM - 6 PM)</div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}