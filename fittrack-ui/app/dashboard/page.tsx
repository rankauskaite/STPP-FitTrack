"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/auth";

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  if (!profile) return <p className="mt-20 text-center">Loading...</p>;

  return (
    <div className="mt-20 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p>Hello, {profile.fullName} 👋</p>
      <p>Your email: {profile.email}</p>
    </div>
  );
}