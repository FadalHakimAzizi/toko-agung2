"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarNav } from "@/components/sidebar-nav"
import { DashboardHeader } from "@/components/dashboard-header"

interface SummaryData {
  omset_bulan_ini: number;
}

const API_BASE = "http://localhost/toko-agung-api/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn")
      if (!isLoggedIn) {
        router.push("/login")
        return;
      }
      
      try {
        const summaryRes = await fetch(`${API_BASE}/dashboard/summary.php`);
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      } catch (error) {
        console.error("Failed to fetch summary for layout:", error);
      } finally {
        setIsLoading(false)
      }
    };
    
    checkAuthAndFetchData();
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C559] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarNav omsetBulanIni={summary?.omset_bulan_ini} />
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}