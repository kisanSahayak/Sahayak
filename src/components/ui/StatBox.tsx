interface StatBoxProps {
    label: string;
    value: string;
}

export default function StatBox({ label, value }: StatBoxProps) {
    return (
        <div className="flex flex-col items-center justify-center py-5 border-r last:border-r-0 border-gray-300 bg-white">
            <div className="text-3xl font-bold text-blue-900">
                {value}
            </div>
            <div className="text-sm text-gray-600">
                {label}
            </div>
        </div>
    );
}