"use client"

// Hook client untuk mengetahui siapa yang sedang login (atau belum login sama
// sekali), dipakai komponen header/navigasi supaya UI bisa menyesuaikan diri
// (mis. sembunyikan tombol "Login" kalau sudah login).
import { useCallback, useEffect, useState } from "react"

export interface CurrentUser {
  id: number
  username: string
  nama_lengkap: string
  role: "admin" | "user"
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { user, loading, refresh }
}
