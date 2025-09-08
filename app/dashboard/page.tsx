"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, ShoppingCart, TrendingUp } from "lucide-react"
import { LineChart } from "@/components/sales-chart"
import { TopProductsTable } from "@/components/top-products-table"
import type { ChartData } from "chart.js"

// Types
interface SummaryData {
  total_produk: number;
  transaksi_hari_ini: number;
  omset_hari_ini: number;
  omset_percentage_change: number;
}

interface TopProduct {
  name: string;
  category: string;
  sold: number;
  revenue: number;
}

const API_BASE = "https://toko-agung.my.id/toko-agung-api/api"

const initialChartData: ChartData<'line'> = {
  labels: [],
  datasets: [{
    label: 'Pendapatan',
    data: [],
    fill: true,
    borderColor: 'rgb(0, 197, 89)',
    backgroundColor: 'rgba(0, 197, 89, 0.1)',
    tension: 0.4
  }]
};


export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [chartData, setChartData] = useState<ChartData<'line'>>(initialChartData);
  const [chartRange, setChartRange] = useState('weekly');
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const summaryRes = await fetch(`${API_BASE}/dashboard/summary.php`)
        const summaryData = await summaryRes.json()
        setSummary(summaryData)

        const topProductsRes = await fetch(`${API_BASE}/laporan/top_products.php`)
        const topProductsData = await topProductsRes.json()
        if (topProductsData.records) {
          setTopProducts(topProductsData.records)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  useEffect(() => {
    const fetchChartData = async () => {
        try {
            const res = await fetch(`${API_BASE}/laporan/sales_chart.php?range=${chartRange}`);
            const data = await res.json();
            if(data.labels && data.datasets) {
                setChartData(data);
            }
        } catch (error) {
            console.error(`Failed to fetch ${chartRange} chart data:`, error);
        }
    };
    fetchChartData();
  }, [chartRange]);
  
  const formatPercentage = (change: number) => {
    if (change > 0) {
      return `+${change}% dari kemarin`;
    } else if (change < 0) {
      return `${change}% dari kemarin`;
    }
    return 'Sama seperti kemarin';
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-100px)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C559] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data dasbor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-[#2D2D2D]">Dashboard Toko Agung</h1>
      <div className="grid gap-4 md:grid-cols-3">
         <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="w-4 h-4 text-[#00C559]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2D2D]">{summary?.total_produk ?? 0}</div>
            <p className="text-xs text-muted-foreground">Jumlah produk aktif</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
            <ShoppingCart className="w-4 h-4 text-[#00C559]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2D2D]">{summary?.transaksi_hari_ini ?? 0}</div>
             <p className="text-xs text-muted-foreground">&nbsp;</p> 
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Omset Hari Ini</CardTitle>
            <TrendingUp className="w-4 h-4 text-[#00C559]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2D2D]">Rp {summary?.omset_hari_ini.toLocaleString('id-ID') ?? 0}</div>
            <p className="text-xs text-muted-foreground">
                {summary ? formatPercentage(summary.omset_percentage_change) : '...'}
            </p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="weekly" onValueChange={(value) => setChartRange(value)}>
        <TabsList>
          <TabsTrigger value="weekly">Mingguan</TabsTrigger>
          <TabsTrigger value="monthly">Bulanan</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly" className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#2D2D2D]">Grafik Penjualan 7 Hari Terakhir</CardTitle>
            </CardHeader>
            <CardContent className="pl-2 h-[350px]">
              <LineChart chartData={chartData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="monthly" className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#2D2D2D]">Grafik Penjualan 12 Bulan Terakhir</CardTitle>
            </CardHeader>
            <CardContent className="pl-2 h-[350px]">
              <LineChart chartData={chartData}/>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#2D2D2D]">5 Produk Terlaris</CardTitle>
        </CardHeader>
        <CardContent>
          <TopProductsTable products={topProducts} />
        </CardContent>
      </Card>
    </div>
  )
}
