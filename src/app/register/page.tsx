"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { verhoeffValidate } from '@/lib/verhoeff'

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Other"
];

export default function RegisterPage() {
  const [form, setForm] = useState<any>({
    full_name: "",
    phone: "",
    email: "",
    state: "",
    district: "",
    village: "",
    land_area_acres: "",
    password: "",
    confirm_password: "",
    aadhaar_number: '',
  });

  const [error, setError] = useState("");
  const [aadhaarError, setAadhaarError] = useState('')
  const [aadhaarValid, setAadhaarValid] = useState(false)

  const handleChange = (e: any) => {
    setForm((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleAadhaar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 12)
    setForm((prev: any) => ({ ...prev, aadhaar_number: value }))

    if (value.length === 0) {
      setAadhaarError('')
      setAadhaarValid(false)
    } else if (value.length < 12) {
      setAadhaarError('Aadhaar number must be 12 digits')
      setAadhaarValid(false)
    } else if (!verhoeffValidate(value)) {
      setAadhaarError('Invalid Aadhaar number — please check and re-enter')
      setAadhaarValid(false)
    } else {
      setAadhaarError('')
      setAadhaarValid(true)
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!aadhaarValid) {
      setError('Please enter a valid 12-digit Aadhaar number')
      return
    }

    try {
      // Send only last 4 digits — never send full Aadhaar to backend
      const payload = {
        ...form,
        aadhaar_last4: form.aadhaar_number.slice(-4),
        aadhaar_number: undefined,
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      alert("Registered successfully!");
      window.location.href = "/dashboard";

    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />

      <div className="max-w-5xl w-full mx-auto text-sm text-gray-600 py-4 px-4">
        <Link href="/" className="text-blue-700">Home</Link> › New Farmer Registration
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-12">
        <h1 className="text-2xl font-semibold text-blue-900 mb-4">
          New Farmer Registration Form
        </h1>

        <form onSubmit={handleSubmit} className="bg-white border shadow rounded-lg p-6">

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              ⚠ {error}
            </div>
          )}

          {/* PERSONAL DETAILS */}
          <h2 className="text-blue-900 font-semibold text-lg mb-3">Personal Details</h2>

          <label className="block mb-1 font-medium text-sm">Full Name *</label>
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <label className="block mb-1 font-medium text-sm">Mobile Number *</label>
          <div className="flex mb-4">
            <span className="bg-gray-200 border border-r-0 px-3 flex items-center text-sm">+91</span>
            <input
              name="phone"
              maxLength={10}
              value={form.phone}
              onChange={handleChange}
              className="w-full border rounded-r px-3 py-2"
              placeholder="Enter 10-digit mobile number"
            />
          </div>

          <label className="block mb-1 font-medium text-sm">Email (Optional)</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-4"
          />

          {/* Aadhaar Number */}
          <label className="block mb-1 font-medium text-sm">Aadhaar Number *</label>
          <div style={{ position: 'relative' }} className="mb-1">
            <input
              name="aadhaar_number"
              value={form.aadhaar_number}
              onChange={handleAadhaar}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter 12-digit Aadhaar number"
              maxLength={12}
              required
            />
            {form.aadhaar_number.length === 12 && (
              <span style={{
                position: 'absolute', right: '10px', top: '50%',
                transform: 'translateY(-50%)',
                color: aadhaarValid ? '#2e7d32' : '#c62828',
                fontWeight: 700, fontSize: '12px'
              }}>
                {aadhaarValid ? '✓ Valid' : '✗ Invalid'}
              </span>
            )}
          </div>
          {aadhaarError ? (
            <div style={{ color: '#c62828', fontSize: '11px', marginTop: '4px' }} className="mb-4">
              {aadhaarError}
            </div>
          ) : <div className="mb-4" />}

          {/* LOCATION DETAILS */}
          <h2 className="text-blue-900 font-semibold text-lg mb-3">Location Details</h2>

          <label className="block mb-1 font-medium text-sm">State *</label>
          <select
            name="state"
            value={form.state}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-4"
          >
            <option value="">-- Select State --</option>
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <label className="block mb-1 font-medium text-sm">District *</label>
          <input
            name="district"
            value={form.district}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <label className="block mb-1 font-medium text-sm">Village / Town *</label>
          <input
            name="village"
            value={form.village}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-6"
          />

          <label className="block mb-1 font-medium text-sm">Land Area (Acres)</label>
          <input
            name="land_area_acres"
            type="number"
            value={form.land_area_acres}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-6"
          />

          {/* PASSWORD */}
          <h2 className="text-blue-900 font-semibold text-lg mb-3">Set Password</h2>

          <label className="block mb-1 font-medium text-sm">Password *</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <label className="block mb-1 font-medium text-sm">Confirm Password *</label>
          <input
            type="password"
            name="confirm_password"
            value={form.confirm_password}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-6"
          />

          <button
            type="submit"
            className="bg-blue-900 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-800"
          >
            Submit Registration
          </button>

        </form>
      </main>

      <Footer />
    </div>
  );
}