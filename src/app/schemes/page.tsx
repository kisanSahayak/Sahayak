const schemes = [
    {
        title: "PM-Kisan Samman Nidhi (PM-KISAN)",
        desc: "₹6,000 annual support to farmers in 3 installments through DBT.",
    },
    {
        title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        desc: "Crop insurance against natural calamities, pests, and diseases.",
    },
    {
        title: "Kisan Credit Card (KCC)",
        desc: "Instant short-term loans at low interest for agriculture needs.",
    },
    {
        title: "Soil Health Card Scheme",
        desc: "Detailed soil analysis and crop-based nutrient recommendations.",
    },
    {
        title: "PM Krishi Sinchai Yojana (PMKSY)",
        desc: "Irrigation coverage expansion with micro-irrigation systems.",
    },
    {
        title: "e-NAM",
        desc: "Online National Agriculture Market for better crop prices.",
    },
];

export default function SchemesPage() {
    return (
        <div className="page-wrapper">
            <main className="content-area py-6">

                {/* Breadcrumb */}
                <div className="text-sm text-gray-600 mb-4">
                    <span>Home</span> › <span className="font-semibold">Schemes</span>
                </div>

                <h1 className="text-2xl font-bold text-blue-900 mb-4">Government Schemes for Farmers</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {schemes.map((s, i) => (
                        <div key={i} className="bg-white border rounded-lg shadow p-4">
                            <h3 className="text-lg font-semibold text-blue-900">{s.title}</h3>
                            <p className="text-gray-700 mt-2">{s.desc}</p>
                        </div>
                    ))}

                </div>

            </main>
        </div>
    );
}