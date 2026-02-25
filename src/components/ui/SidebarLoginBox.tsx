import Link from "next/link";

export default function SidebarLoginBox() {
    return (
        <div className="sidebar-box">
            <p>Login to access dashboard and track applications.</p>

            <Link href="/login" className="btn-primary full">
                Login to Portal
            </Link>

            <Link href="/register" className="btn-outline full">
                New Registration
            </Link>
        </div>
    );
}