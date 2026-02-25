"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function LoginPage() {
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error || "Login failed");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="page-wrapper">
      <Header />

      <main className="content-area">

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link href="/">Home</Link> › Farmer Login
        </div>

        <div className="main-grid">

          {/* LEFT SIDEBAR INFO */}
          <div className="left-col">
            <div className="section-box">
              <div className="section-heading">Farmer Login Portal</div>

              <div className="section-content">
                <p>Registered farmers can login to:</p>

                <ul className="info-list">
                  <li>Check application status</li>
                  <li>Upload pending documents</li>
                  <li>Receive scheme updates</li>
                  <li>Track verification progress</li>
                  <li>Get personalized scheme recommendations</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT LOGIN SECTION */}
          <div className="right-col">
            <div className="section-box">
              <div className="section-heading">Farmer Login</div>

              <div className="form-box">
                {/* Error Box */}
                {error && <div className="error-box">⚠ {error}</div>}

                {/* LOGIN FORM */}
                <form onSubmit={handleSubmit}>

                  {/* Mobile Number */}
                  <label className="form-label">Mobile Number *</label>
                  <div className="phone-group">
                    <span>+91</span>
                    <input
                      name="phone"
                      type="tel"
                      maxLength={10}
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="Enter 10-digit number"
                    />
                  </div>

                  {/* Password */}
                  <label className="form-label">Password *</label>
                  <input
                    name="password"
                    type="password"
                    className="form-input"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter password"
                  />

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary full"
                  >
                    {loading ? "Verifying..." : "Login"}
                  </button>

                </form>

                {/* Links */}
                <div className="login-links">
                  <p>
                    New user?{" "}
                    <Link href="/register">
                      Register here
                    </Link>
                  </p>
                  <p>
                    Need help? <strong>1800-XXX-XXXX</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="notice-bar">
              🔒 This is an official government portal. Never share your password.
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}