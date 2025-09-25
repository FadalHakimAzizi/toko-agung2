"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon } from "lucide-react"
import { format, subDays } from "date-fns"
import { id } from "date-fns/locale"
import { DateRange } from "react-day-picker"

interface Laporan {
    id: number;
    no_faktur: string;
    tanggal: string;
    items: any;
    total_item: number;
    total_harga: number;
    metode_pembayaran: string;
}

const API_BASE = "https://toko-agung.my.id/toko-agung-api/api"

export default function LaporanPage() {
    const [data, setData] = useState<Laporan[]>([]);
    const [loading, setLoading] = useState(true);
    // ❌ KODE LAMA (Penyebab Error)
    // const [dateRange, setDateRange] = useState<DateRange | undefined>({
    //     from: subDays(new Date(), 30),
    //     to: new Date(),
    // });
    
    // ✅ PERBAIKAN: Mulai dengan state kosong
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // ✅ PERBAIKAN: Atur tanggal awal hanya di sisi client menggunakan useEffect
    useEffect(() => {
        setDateRange({
            from: subDays(new Date(), 30),
            to: new Date(),
        });
    }, []); // Array dependensi kosong agar hanya berjalan sekali saat komponen dimuat

    useEffect(() => {
        const fetchLaporan = async () => {
            // Jangan jalankan fetch jika dateRange belum di-set
            if (!dateRange || !dateRange.from || !dateRange.to) return;
            
            setLoading(true);
            const fromDate = format(dateRange.from, "yyyy-MM-dd");
            const toDate = format(dateRange.to, "yyyy-MM-dd");

            try {
                const response = await fetch(`${API_BASE}/transaksi/read.php?start_date=${fromDate}&end_date=${toDate}`);
                if (!response.ok) { // Tambahkan pengecekan jika fetch gagal
                    throw new Error('Gagal mengambil data dari server');
                }
                const result = await response.json();
                setData(result.records || []); // Pastikan setData menerima array
            } catch (error) {
                console.error("Failed to fetch reports:", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLaporan();
    }, [dateRange]); // useEffect ini tetap berjalan setiap kali dateRange berubah
    
    // ... sisa kode Anda (tidak perlu diubah)
    
    const totalSales = data.reduce((sum, sale) => sum + Number(sale.total_harga), 0)
    const totalTransactions = data.length

    const formatItemNames = (items: any) => {
        let itemsArray;
        if (typeof items === 'string') {
            try {
                itemsArray = JSON.parse(items);
            } catch (e) {
                console.error("Gagal mem-parsing JSON string:", items);
                return "Format JSON string salah";
            }
        } else {
            itemsArray = items;
        }

        if (Array.isArray(itemsArray)) {
            return itemsArray.map(item => item.nama_barang).join(", ");
        }
        return "Data item tidak valid";
    };

    const renderTableBody = () => {
        if (loading) {
            return (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Memuat data...</TableCell>
                </TableRow>
            );
        }
        if (data.length > 0) {
            return data.map((sale) => (
                <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.no_faktur}</TableCell>
                    <TableCell>{format(new Date(sale.tanggal), "dd MMMM yyyy, HH:mm", { locale: id })}</TableCell>
                    <TableCell className="whitespace-normal max-w-[300px] truncate">
                        {formatItemNames(sale.items)}
                    </TableCell>
                    <TableCell className="text-center">{sale.total_item}</TableCell>
                    <TableCell className="text-right">Rp {Number(sale.total_harga).toLocaleString('id-ID')}</TableCell>
                </TableRow>
            ));
        }
        return (
            <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                    Tidak ada transaksi pada rentang tanggal ini
                </TableCell>
            </TableRow>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Laporan Penjualan</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Filter Tanggal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pilih tanggal...</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="range" selected={dateRange} onSelect={setDateRange} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTransactions}</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rp {totalSales.toLocaleString('id-ID')}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Daftar Transaksi</CardTitle>
                </CardHeader>
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
                            <TableBody>
                                {renderTableBody()}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
