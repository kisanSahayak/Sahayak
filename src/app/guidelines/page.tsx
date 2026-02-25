export default function GuidelinesPage() {
    return (
        <div className="page-wrapper">
            <main className="content-area py-6">

                {/* Breadcrumb */}
                <div className="text-sm text-gray-600 mb-4">
                    <span>Home</span> › <span className="font-semibold">Guidelines</span>
                </div>

                <div className="bg-white border rounded-lg shadow p-6 space-y-6">

                    <h1 className="text-2xl font-bold text-blue-900">Farmer Registration Guidelines</h1>

                    {/* Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-blue-900">Basic Requirements</h2>
                        <ul className="list-disc pl-6 mt-1 text-gray-700 space-y-1">
                            <li>You must be an Indian citizen</li>
                            <li>Mobile number must be linked with Aadhaar</li>
                            <li>Provide correct land ownership documents</li>
                            <li>Documents must be readable and valid</li>
                        </ul>
                    </section>

                    {/* Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-blue-900">Documents Required</h2>
                        <ul className="list-disc pl-6 mt-1 text-gray-700 space-y-1">
                            <li>Aadhaar Card</li>
                            <li>Land Records (Khatoni / Patta / RoR)</li>
                            <li>Bank Passbook / Cancelled Cheque</li>
                            <li>Income Certificate</li>
                            <li>Caste Certificate (if needed)</li>
                            <li>Passport Photograph</li>
                        </ul>
                    </section>

                    {/* Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-blue-900">eKYC Guidelines</h2>
                        <ul className="list-disc pl-6 mt-1 text-gray-700 space-y-1">
                            <li>eKYC is mandatory for all farmers</li>
                            <li>OTP is sent to Aadhaar-linked mobile number</li>
                            <li>If OTP fails, visit nearest CSC center</li>
                        </ul>
                    </section>

                    {/* Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-blue-900">Bank Guidelines</h2>
                        <ul className="list-disc pl-6 mt-1 text-gray-700 space-y-1">
                            <li>Bank account must be active & single-holder</li>
                            <li>Account must be Aadhaar seeded</li>
                            <li>Enter correct IFSC code & account details</li>
                        </ul>
                    </section>

                </div>
            </main>
        </div>
    );
}