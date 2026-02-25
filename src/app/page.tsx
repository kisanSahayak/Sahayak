import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* Header */}
      <Header />

      {/* 🔔 Blinking Important Notice */}
      <div className="w-full bg-yellow-100 border-t border-b border-yellow-400 py-2">
        <p className="text-center text-sm font-semibold text-red-700 blink">
          <span className="font-bold">Important: </span>
          eKYC is MANDATORY for all registered farmers. OTP-based eKYC is available on this portal.
        </p>
      </div>

      {/* 📊 STATISTICS GRID — Updated */}
      <div className="w-full max-w-5xl mx-auto mt-4 grid grid-cols-2 md:grid-cols-4 border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white">
        {[
          ["12,48,532", "Registered Farmers"],
          ["24", "Schemes Available"],
          ["8,94,210", "Documents Verified"],
          ["₹ 2,840 Cr", "Benefits Disbursed"],
        ].map(([value, label], index) => (
          <div
            key={label}
            className={`text-center py-4 flex flex-col justify-center border-gray-300 
                        ${index !== 3 ? "border-r" : ""} 
                        ${index < 2 ? "md:border-b md:border-r" : ""} 
                        md:border-b-0`}
          >
            <p className="text-xl font-extrabold text-blue-900">{value}</p>
            <p className="text-xs text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      <main className="flex-1 max-w-6xl mx-auto px-4">

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* LEFT SECTION */}
          <div className="md:col-span-2 space-y-4">

            {/* Farmer Corner */}
            <section className="bg-white shadow border rounded">
              <h3 className="bg-blue-100 font-semibold text-sm px-4 py-2 border-b text-blue-900">
                Farmer’s Corner
              </h3>

              <div className="grid grid-cols-2">
                {[
                  ["New Farmer Registration", "/register"],
                  ["Upload Documents", "/upload"],
                  ["Track Application Status", "/dashboard"],
                  ["Notifications & Alerts", "/notifications"],
                ].map(([title, link], i) => (
                  <Link
                    key={title}
                    href={link}
                    className={`p-4 border text-sm hover:bg-blue-50 
                                ${i === 0 ? "bg-blue-900 text-white" : ""}`}
                  >
                    {title}
                  </Link>
                ))}
              </div>
            </section>

            {/* How It Works */}
            <section className="bg-white shadow border rounded">
              <h3 className="bg-blue-100 font-semibold text-sm px-4 py-2 border-b text-blue-900">
                How It Works
              </h3>

              <div className="grid grid-cols-4 text-center text-sm">
                {[
                  ["01", "Register"],
                  ["02", "Upload"],
                  ["03", "Verify"],
                  ["04", "Apply"],
                ].map(([num, text]) => (
                  <div key={num} className="p-4 border-r last:border-r-0">
                    <p className="text-lg font-bold text-gray-400">{num}</p>
                    <p className="font-semibold text-blue-900">{text}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT SECTION */}
          <div className="space-y-4">

            {/* Login Box */}
            <section className="bg-white shadow border rounded p-4">
              <h3 className="bg-blue-100 font-semibold text-sm px-4 py-2 border-b -mx-4 mb-4 text-blue-900">
                Farmer Login
              </h3>

              <p className="text-sm text-gray-700 mb-3">
                Login to access your dashboard, track applications, and more.
              </p>

              <Link
                href="/login"
                className="block w-full bg-blue-900 text-center text-white py-2 text-sm font-semibold rounded hover:bg-blue-800"
              >
                Login to Portal
              </Link>

              <Link
                href="/register"
                className="block w-full mt-2 border border-blue-900 text-center text-blue-900 py-2 text-sm font-semibold rounded hover:bg-blue-50"
              >
                New Registration
              </Link>
            </section>

            {/* Required Documents */}
            <section className="bg-white shadow border rounded p-4">
              <h3 className="bg-blue-100 font-semibold text-sm px-4 py-2 border-b -mx-4 mb-4 text-blue-900">
                Required Documents
              </h3>

              <ul className="text-sm space-y-2 text-gray-700">
                {[
                  "Land Record / Khatoni",
                  "Aadhaar Card (both sides)",
                  "Bank Passbook / Cancelled Cheque",
                  "Income Certificate",
                  "Caste Certificate (if applicable)",
                  "Passport Size Photograph",
                ].map((doc) => (
                  <li key={doc} className="border-b pb-1">{doc}</li>
                ))}
              </ul>
            </section>

          </div>

        </div>
      </main>

      {/* Footer */}
      {/* <Footer /> */}
    </div>
  );
}