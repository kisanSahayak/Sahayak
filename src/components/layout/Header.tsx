"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user?: { fullName: string; role: string } | null;
  unreadCount?: number;
}

export default function Header({ user, unreadCount = 0 }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="w-full shadow-sm">

      {/* 🟧 Tricolor Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-green-600" />

      {/* 🟦 Utility Bar */}
      <div className="w-full bg-gray-100 text-gray-700 text-xs py-1 px-4 flex justify-between">
        <span>
          Ministry of Agriculture & Farmers Welfare, Government of India
        </span>

        <div className="flex gap-2">
          <button className="hover:underline">English</button>
          <span>|</span>
          <button className="hover:underline">हिन्दी</button>
        </div>
      </div>

      {/* 🟦 Main Header */}
      <div className="w-full bg-[#163971] text-white">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-3">

          {/* Branding */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full border-2 border-orange-500 flex flex-col items-center justify-center font-bold text-[8px] text-blue-900 leading-tight">
              <span>GOVT.</span>
              <span>INDIA</span>
            </div>

            <div>
              <div className="text-lg font-bold">KisanSahayak</div>
              <div className="text-[11px] opacity-75">
                Department of Agriculture & Farmers Welfare
              </div>
            </div>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-4">

            {/* Notifications */}
            {user && (
              <Link href="/notifications" className="relative text-xl">
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold px-1 rounded-full">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 bg-blue-800 px-3 py-1 rounded text-sm"
                >
                  <span className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center font-bold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium">{user.fullName}</span>
                  ▼
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 bg-white text-gray-800 shadow-lg border rounded w-40 text-sm">
                    <Link href="/dashboard" className="block px-3 py-2 hover:bg-gray-100">
                      Dashboard
                    </Link>
                    <Link href="/upload" className="block px-3 py-2 hover:bg-gray-100">
                      Upload Documents
                    </Link>
                    <Link href="/notifications" className="block px-3 py-2 hover:bg-gray-100">
                      Notifications
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="bg-blue-600 px-4 py-1 rounded text-sm font-semibold hover:bg-blue-700"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="border border-white px-4 py-1 rounded text-sm font-semibold hover:bg-white hover:text-blue-900"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🟦 Navigation Bar */}
      <nav className="w-full bg-blue-100 border-t border-blue-300">
        <div className="max-w-6xl mx-auto flex text-sm">

          {/* Home */}
          <Link
            href="/"
            className="px-5 py-2 border-r border-blue-300 font-medium text-blue-900 hover:bg-blue-200"
          >
            Home
          </Link>

          {/* About */}
          <Link
            href="/about"
            className="px-5 py-2 border-r border-blue-300 font-medium text-blue-900 hover:bg-blue-200"
          >
            About
          </Link>

          {/* Schemes */}
          <Link
            href="/schemes"
            className="px-5 py-2 border-r border-blue-300 font-medium text-blue-900 hover:bg-blue-200"
          >
            Schemes
          </Link>

          {/* Guidelines */}
          <Link
            href="/guidelines"
            className="px-5 py-2 border-r border-blue-300 font-medium text-blue-900 hover:bg-blue-200"
          >
            Guidelines
          </Link>

          {/* Contact → scroll to footer */}
          <Link
            href="/#contact-section"
            className="px-5 py-2 border-r border-blue-300 font-medium text-blue-900 hover:bg-blue-200"
          >
            Contact
          </Link>
        </div>
      </nav>

      {/* 🔵 Ticker */}
      <div className="relative w-full bg-[#163971] text-white text-sm h-7 overflow-hidden">

        {/* LATEST fixed on top */}
        <span className="absolute left-0 top-0 z-20 bg-orange-600 px-3 py-1 font-bold h-full flex items-center">
          LATEST
        </span>

        {/* Marquee scrolling behind */}
        <div className="absolute left-0 top-0 h-full w-full flex items-center pl-28 animate-marquee z-10 whitespace-nowrap">
          New scheme applications are open for 2025–26 • Upload your documents for verification • eKYC is mandatory • Visit CSC for assistance
        </div>
      </div>
    </header>
  );
}