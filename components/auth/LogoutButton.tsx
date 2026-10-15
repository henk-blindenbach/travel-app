"use client";

import { useState } from "react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.all(names.filter((name) => name.startsWith("nos-")).map((name) => caches.delete(name)));
      }
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.filter((registration) => new URL(registration.scope).origin === window.location.origin).map((registration) => registration.unregister()));
      }
    } finally {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.assign("/login");
    }
  }

  return <button className="text-button" type="button" disabled={busy} onClick={() => void logout()}>{busy ? "Uitloggen…" : "Uitloggen"}</button>;
}
