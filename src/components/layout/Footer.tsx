export default function Footer() {
  return (
    <footer
      id="contact-section"  // 🔥 This enables scrolling from "Contact" tab
      className="bg-govBlue text-white mt-10"
    >
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* About Portal */}
        <div>
          <h3 className="text-govOrange font-bold text-sm uppercase border-b border-white/30 pb-1 mb-3">
            About Portal
          </h3>
          <p className="text-sm text-gray-200 leading-6">
            The Farmer Scheme Portal helps farmers access government schemes, submit documents,
            track application status, and get real-time updates.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-govOrange font-bold text-sm uppercase border-b border-white/30 pb-1 mb-3">
            Quick Links
          </h3>
          <ul className="text-sm space-y-2 text-gray-200">
            <li><a href="#" className="hover:text-white">Scheme Guidelines</a></li>
            <li><a href="#" className="hover:text-white">Document Checklist</a></li>
            <li><a href="#" className="hover:text-white">Grievance Portal</a></li>
            <li><a href="#" className="hover:text-white">Find Nearest CSC</a></li>
          </ul>
        </div>

        {/* Help & Support */}
        <div>
          <h3 className="text-govOrange font-bold text-sm uppercase border-b border-white/30 pb-1 mb-3">
            Help & Support
          </h3>
          <p className="text-sm text-gray-200">
            Helpline: <strong>1800-XXX-XXXX</strong>
          </p>
          <p className="text-sm text-gray-200">Mon–Sat (9:00 AM – 6:00 PM)</p>
          <p className="text-sm text-gray-200">support@farmerscheme.gov.in</p>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="bg-govBlue/90 text-center py-3 text-xs">
        © 2025 Farmer Scheme Portal • Ministry of Agriculture & Farmers Welfare, Government of India
      </div>
    </footer>
  );
}