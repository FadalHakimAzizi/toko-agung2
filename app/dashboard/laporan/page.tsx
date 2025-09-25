"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, AlertTriangle, Info } from "lucide-react"
import { format, subDays } from "date-fns"
import { id } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface Item {
    nama_barang: string;
    [key: string]: string | number;
}

interface Laporan {
    id: number;
    no_faktur: string;
    tanggal: string;
    items: Item[] | string;
    total_item: number;
    total_harga: number;
    metode_pembayaran: string;
}

const API_BASE = "https://toko-agung.my.id/toko-agung-api/api"

export default function LaporanPage() {
    const [data, setData] = useState<Laporan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    useEffect(() => {
        setDateRange({ from: subDays(new Date(), 30), to: new Date() });
    }, []);

    useEffect(() => {
        const fetchLaporan = async () => {
            if (!dateRange?.from || !dateRange.to) return;
            
            setLoading(true);
            setError(null);
            const fromDate = format(dateRange.from, "yyyy-MM-dd");
            const toDate = format(dateRange.to, "yyyy-MM-dd");

            try {
                const response = await fetch(`${API_BASE}/transaksi/read.php?start_date=${fromDate}&end_date=${toDate}`);
                const result = await response.json();

                if (response.ok) {
                    setData(result.records || []);
                } else {
                    throw new Error(result.message || "Gagal mengambil data dari server");
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan.";
                setError(errorMessage);
                setData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchLaporan();
    }, [dateRange]);
    
    const totalSales = data.reduce((sum, sale) => sum + Number(sale.total_harga), 0)
    const totalTransactions = data.length

    const formatItemNames = (items: Item[] | string): string => {
        if (Array.isArray(items)) {
            return items.map(item => item.nama_barang).join(", ");
        }
        if (typeof items === 'string') {
            try { 
                const parsedItems: Item[] = JSON.parse(items);
                return parsedItems.map(item => item.nama_barang).join(", ");
            } catch { return "Format JSON salah"; }
        }
        return "Data tidak valid";
    };

    const renderTableBody = () => {
        if (loading) {
            return <TableRow><TableCell colSpan={5} className="h-24 text-center">Memuat data...</TableCell></TableRow>;
        }
        if (error) {
            return <TableRow><TableCell colSpan={5} className="h-24 text-center text-red-600"><div className="flex items-center justify-center gap-2"><AlertTriangle size={16} /><span>Error: {error}</span></div></TableCell></TableRow>;
        }
        if (data.length === 0) {
            return <TableRow><TableCell colSpan={5} className="h-24 text-center"><div className="flex items-center justify-center gap-2"><Info size={16} /><span>Tidak ada transaksi pada rentang tanggal ini.</span></div></TableCell></TableRow>;
        }
        return data.map((sale) => (
            <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.no_faktur}</TableCell>
                <TableCell>{format(new Date(sale.tanggal), "dd MMMM yyyy, HH:mm", { locale: id })}</TableCell>
                <TableCell className="whitespace-normal max-w-[300px] truncate">{formatItemNames(sale.items)}</TableCell>
                <TableCell className="text-center">{sale.total_item}</TableCell>
                <TableCell className="text-right">Rp {Number(sale.total_harga).toLocaleString('id-ID')}</TableCell>
            </TableRow>
        ));
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Laporan Penjualan</h1>
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm">
                    <CardHeader><CardTitle>Filter Tanggal</CardTitle></CardHeader>
                    <CardContent>
                        <Popover>
                            <PopoverTrigger
                                disabled={!dateRange}
                                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start text-left font-normal")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : "Pilih tanggal..."}
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="range" selected={dateRange} onSelect={setDateRange} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"><CardTitle className="text-sm font-medium">Total Transaksi</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{totalTransactions}</div></CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"><CardTitle className="text-sm font-medium">Total Penjualan</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">Rp {totalSales.toLocaleString('id-ID')}</div></CardContent>
                </Card>
            </div>
            <Card className="border-none shadow-sm">
                <CardHeader><CardTitle>Daftar Transaksi</CardTitle></CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Faktur</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Nama Barang</TableHead>
                                    <TableHead className="text-center">Jumlah Item</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>{renderTableBody()}</TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
