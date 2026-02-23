import Link from "next/link";

interface CornerCardProps {
    title: string;
    desc: string;
    href: string;
    accent?: boolean;
}

export default function CornerCard({ title, desc, href, accent }: CornerCardProps) {
    return (
        <Link
            href={href}
            className={`corner-card ${accent ? "accent" : ""}`}
        >
            <div className="corner-title">{title}</div>
            <div className="corner-desc">{desc}</div>
        </Link>
    );
}