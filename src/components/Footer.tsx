export default function Footer() {
  return (
    <footer className="bg-gov-blue-dark text-white border-t-4 border-gov-orange mt-12">
      
      {/* Top Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

          {/* About */}
          <div>
            <h3 className="footer-heading">About Portal</h3>
            <p className="footer-text">
              The Farmer Scheme Portal enables farmers to access government schemes,
              apply online, and track application status through a unified platform.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-list">
              <li><a href="#">Scheme Guidelines</a></li>
              <li><a href="#">Document Checklist</a></li>
              <li><a href="#">Grievance Portal</a></li>
              <li><a href="#">Find Nearest CSC</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="footer-heading">Help & Support</h3>
            <p className="footer-text">Helpline: 1800-XXX-XXXX (Toll Free)</p>
            <p className="footer-text">Working Hours: Mon–Sat (9:00 AM – 6:00 PM)</p>
            <p className="footer-text">Email: support@farmerscheme.gov.in</p>
          </div>

        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-blue-800"></div>

      {/* Bottom Bar */}
      <div className="bg-blue-950 text-center text-xs text-blue-200 py-3 px-4">
        © 2025 Farmer Scheme Portal | Ministry of Agriculture & Farmers Welfare <br />
        Government of India
      </div>
    </footer>
  )
}