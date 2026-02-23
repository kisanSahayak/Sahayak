export default function AboutPage() {
    return (
        <div className="page-wrapper">
            <main className="content-area py-6">

                {/* Breadcrumb */}
                <div className="text-sm text-gray-600 mb-4">
                    <span>Home</span> › <span className="font-semibold">About</span>
                </div>

                <div className="bg-white border rounded-lg shadow p-6 space-y-4">

                    <h1 className="text-2xl font-bold text-blue-900">About KisanSahayak Portal</h1>

                    <p className="text-gray-700 leading-6">
                        The <strong>KisanSahayak Portal</strong> is an integrated platform
                        created to provide farmers across India with transparent and unified access
                        to government welfare schemes, subsidies, and support services.
                    </p>

                    <h2 className="text-xl font-semibold text-blue-900 mt-4">Our Vision</h2>
                    <p className="text-gray-700">
                        To empower every farmer with fast, transparent, and reliable digital access
                        to all agriculture-related services.
                    </p>

                    <h2 className="text-xl font-semibold text-blue-900 mt-4">Mission</h2>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1">
                        <li>Simplify the application & verification process</li>
                        <li>Provide instant scheme updates</li>
                        <li>Ensure transparency in benefit distribution</li>
                        <li>Support farmers through digital innovation</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-blue-900 mt-4">What This Portal Provides</h2>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1">
                        <li>Farmer Registration</li>
                        <li>Document Upload & Verification</li>
                        <li>Real-time Scheme Alerts</li>
                        <li>Eligibility Checking</li>
                        <li>Dashboard for all applications</li>
                        <li>Payment and approval tracking</li>
                    </ul>

                    <p className="text-gray-700 mt-4">
                        This portal operates under the{" "}
                        <strong>Ministry of Agriculture & Farmers Welfare, Government of India</strong>.
                    </p>
                </div>

            </main>
        </div>
    );
}