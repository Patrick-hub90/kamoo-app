"use client";

import { DashboardPreview } from "@/components/apercu/dashboard-preview";

/** /apercu — variante NAVY validée, police Poppins (choix user). */
export default function ApercuPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
      />
      <DashboardPreview variant="navy" fontFamily="'Poppins', sans-serif" />
    </>
  );
}
