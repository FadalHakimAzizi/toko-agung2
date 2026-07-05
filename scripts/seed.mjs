// Seeder data awal: akun admin, kategori, barang (dari katalog landing page),
// pengaturan toko, dan knowledge base chatbot.
// Aman dijalankan berulang kali (memakai ON CONFLICT DO NOTHING).
// Jalankan dengan: npm run db:seed
import { randomBytes, scryptSync } from "node:crypto"
import pg from "pg"

try {
  process.loadEnvFile(".env")
} catch {
  // .env belum ada; DATABASE_URL mungkin sudah diatur lewat environment
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("❌ DATABASE_URL belum diatur. Salin .env.example menjadi .env terlebih dahulu.")
  process.exit(1)
}

const needSsl = process.env.DATABASE_SSL === "true" || connectionString.includes("supabase.co") || connectionString.includes("supabase.com")
const client = new pg.Client({ connectionString, ssl: needSsl ? { rejectUnauthorized: false } : undefined })

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`
}

// ---- Data barang: diambil dari katalog di landing page (shoppingCatalog.tsx) ----
const kategoriList = [
  { nama: "Alat Tulis Dasar", deskripsi: "Pulpen, pensil, spidol, dan alat tulis harian" },
  { nama: "Buku & Kertas", deskripsi: "Buku tulis, kertas HVS, dan buku gambar" },
  { nama: "Perlengkapan Sekolah", deskripsi: "Penggaris, jangka, kalkulator, dan kebutuhan sekolah" },
  { nama: "Alat Gambar & Seni", deskripsi: "Pensil warna, cat air, crayon, dan alat seni" },
  { nama: "Perlengkapan Kantor", deskripsi: "Stapler, map, amplop, dan kebutuhan kantor" },
  { nama: "Aksesoris & Lainnya", deskripsi: "Tempat pensil, stiker, tas, dan aksesoris" },
]

const barangList = [
  ["Pulpen berbagai warna", "Alat Tulis Dasar", 4000, 120, "pcs", "Pulpen warna-warni untuk sekolah & kantor.", "/4.jpg"],
  ["Pensil 2B, HB, 2H", "Alat Tulis Dasar", 3000, 150, "pcs", "Pensil berkualitas untuk menulis & menggambar.", "/1.webp"],
  ["Spidol permanen & whiteboard", "Alat Tulis Dasar", 9000, 80, "pcs", "Spidol untuk papan tulis & kebutuhan harian.", "/5.png"],
  ["Penghapus & Tip-Ex", "Alat Tulis Dasar", 5000, 100, "pcs", "Alat penghapus praktis & cepat bersih.", "/2.jpg"],
  ["Buku tulis 38-100 lembar", "Buku & Kertas", 10000, 200, "pcs", "Buku tulis untuk sekolah & kuliah.", "/7.jpg"],
  ["Kertas HVS A4", "Buku & Kertas", 40000, 60, "rim", "Kertas serbaguna untuk cetak & tulis.", "/8.webp"],
  ["Buku gambar & sketsa", "Buku & Kertas", 17000, 75, "pcs", "Buku untuk seni & kreativitas anak.", "/7.jpg"],
  ["Penggaris 15cm & 30cm", "Perlengkapan Sekolah", 5000, 90, "pcs", "Penggaris plastik & besi berbagai ukuran.", "/9.jpeg"],
  ["Set jangka lengkap", "Perlengkapan Sekolah", 22000, 40, "set", "Set jangka untuk pelajaran matematika.", "/10.jpeg"],
  ["Kalkulator scientific", "Perlengkapan Sekolah", 185000, 15, "pcs", "Kalkulator untuk kebutuhan sekolah & kantor.", "/11.jpeg"],
  ["Pensil warna 12-48 warna", "Alat Gambar & Seni", 50000, 35, "set", "Set pensil warna untuk menggambar.", "/4.jpg"],
  ["Cat air & kuas", "Alat Gambar & Seni", 50000, 30, "set", "Cat air untuk anak & pelukis pemula.", "/12.jpeg"],
  ["Crayon & oil pastel", "Alat Gambar & Seni", 42000, 45, "set", "Crayon dan pastel dengan warna cerah.", "/12.jpeg"],
  ["Stapler & isi staples", "Perlengkapan Kantor", 27000, 50, "pcs", "Stapler kuat dengan isi cadangan.", "/13.jpeg"],
  ["Map plastik & karton", "Perlengkapan Kantor", 6000, 150, "pcs", "Map berbagai ukuran untuk dokumen.", "/14.jpeg"],
  ["Amplop berbagai ukuran", "Perlengkapan Kantor", 4000, 200, "pcs", "Amplop cokelat & putih untuk surat.", "/15.jpeg"],
  ["Tempat pensil karakter", "Aksesoris & Lainnya", 32000, 40, "pcs", "Tempat pensil lucu & praktis.", "/16.jpeg"],
  ["Stiker & label nama", "Aksesoris & Lainnya", 10000, 100, "pack", "Stiker custom untuk anak & kantor.", "/17.jpeg"],
  ["Tas sekolah & ransel", "Aksesoris & Lainnya", 175000, 20, "pcs", "Tas kuat & nyaman untuk sekolah.", "/18.jpeg"],
]

// ---- Pengaturan toko (termasuk gambar QRIS untuk pembayaran) ----
const settings = [
  ["store_name", "Toko Alat Tulis Agung"],
  ["store_address", "Jl. Syekh Bayanillah No.609, Setu Wetan, Kec. Weru, Kabupaten Cirebon, Jawa Barat 45154"],
  ["store_phone", "0812-3456-7890"],
  ["store_email", "info@tokoagung.com"],
  ["store_hours", "Senin - Minggu: 06.00 - 21.00 WIB (buka setiap hari termasuk libur nasional)"],
  ["qris_image", "/qris-placeholder.svg"], // ganti lewat halaman Pengaturan dengan QRIS asli toko
]

// ---- Knowledge base chatbot (profil, kebijakan, FAQ dari landing page) ----
const knowledgeBase = [
  ["profil", "Profil Toko", "Toko Alat Tulis Agung adalah toko alat tulis, fotocopy, dan percetakan yang melayani kebutuhan sekolah, kuliah, dan kantor. Menyediakan alat tulis dasar, buku dan kertas, perlengkapan sekolah, alat gambar dan seni, perlengkapan kantor, serta aksesoris.", "profil,tentang,toko agung,toko apa"],
  ["profil", "Alamat Toko", "Toko Alat Tulis Agung beralamat di Jl. Syekh Bayanillah No.609, Setu Wetan, Kec. Weru, Kabupaten Cirebon, Jawa Barat 45154.", "alamat,lokasi,dimana,di mana,maps"],
  ["operasional", "Jam Operasional", "Toko buka setiap hari, Senin sampai Minggu, pukul 06.00 - 21.00 WIB, termasuk hari libur nasional.", "jam,buka,tutup,operasional,hari"],
  ["kebijakan", "Kebijakan Pembayaran", "Pembayaran dapat dilakukan secara tunai di toko, transfer bank (BCA, Mandiri, BRI), e-wallet (GoPay, OVO, DANA), dan QRIS. Untuk pesanan online melalui website, pembayaran menggunakan QRIS lalu unggah bukti pembayaran; pesanan diproses setelah pembayaran diverifikasi admin.", "bayar,pembayaran,qris,transfer,metode,cara bayar"],
  ["faq", "Kirim file lewat HP atau email", "Anda bisa mengirim file melalui WhatsApp, email, atau form upload di website. Format yang didukung: PDF, Word, Excel, PowerPoint, JPG, PNG dengan ukuran maksimal 10MB.", "kirim file,email,whatsapp,upload"],
  ["faq", "Lama pengerjaan print", "Dokumen biasa (1-50 lembar) sekitar 5-10 menit. Dokumen banyak (50-500 lembar) sekitar 30-60 menit. Jilid spiral/lakban tambahan 10-15 menit.", "print,cetak,lama,berapa lama,pengerjaan"],
  ["faq", "Diskon pelajar dan mahasiswa", "Ada diskon 20% untuk pelajar dan mahasiswa dengan menunjukkan kartu pelajar/mahasiswa yang masih berlaku. Berlaku untuk semua layanan fotocopy dan print.", "diskon,promo,pelajar,mahasiswa,murah"],
  ["faq", "Print dari flashdisk", "Tersedia komputer untuk akses flashdisk, CD/DVD, dan memory card. Bisa juga print langsung dari smartphone melalui kabel USB atau Bluetooth.", "flashdisk,usb,print langsung,hp"],
  ["faq", "Layanan antar / delivery", "Tersedia layanan antar untuk pesanan minimal Rp 50.000 dalam radius 5 km dari toko. Biaya antar Rp 10.000 (motor) dan Rp 15.000 (mobil). Gratis ongkir untuk pesanan di atas Rp 200.000.", "antar,delivery,ongkir,kirim"],
  ["faq", "Garansi hasil print", "Ada garansi 100% kepuasan pelanggan. Jika hasil tidak sesuai karena kesalahan toko, dicetak ulang gratis. Untuk kesalahan file dari pelanggan dikenakan biaya 50% dari harga normal.", "garansi,komplain,tidak sesuai,cetak ulang"],
  ["faq", "Layanan editing dan desain", "Tersedia layanan editing sederhana (format ulang, resize, perbaikan kualitas gambar) dan desain grafis (kartu nama, brosur, banner) dengan biaya tambahan mulai Rp 25.000.", "edit,desain,design,kartu nama,brosur,banner"],
]

async function main() {
  await client.connect()

  // 1. Akun admin & user contoh
  await client.query(
    `INSERT INTO users (username, password_hash, nama_lengkap, role)
     VALUES ($1, $2, $3, 'admin') ON CONFLICT (username) DO NOTHING`,
    ["admin", hashPassword("admin123"), "Administrator Toko Agung"],
  )
  await client.query(
    `INSERT INTO users (username, password_hash, nama_lengkap, role)
     VALUES ($1, $2, $3, 'user') ON CONFLICT (username) DO NOTHING`,
    ["pembeli", hashPassword("pembeli123"), "Pembeli Contoh"],
  )
  console.log("✅ Users: admin/admin123 (admin), pembeli/pembeli123 (user)")

  // 2. Kategori
  for (const k of kategoriList) {
    await client.query(
      "INSERT INTO kategori (nama_kategori, deskripsi) VALUES ($1, $2) ON CONFLICT (nama_kategori) DO NOTHING",
      [k.nama, k.deskripsi],
    )
  }
  console.log(`✅ Kategori: ${kategoriList.length} data`)

  // 3. Barang (kode barang dibuat berurutan: BRG-0001, BRG-0002, ...)
  let inserted = 0
  for (let i = 0; i < barangList.length; i++) {
    const [nama, kategori, harga, stok, satuan, deskripsi, gambar] = barangList[i]
    const kode = `BRG-${String(i + 1).padStart(4, "0")}`
    const res = await client.query(
      `INSERT INTO barang (kode_barang, nama_barang, kategori_id, harga, stok, satuan, deskripsi, gambar)
       SELECT $1, $2, k.id, $3, $4, $5, $6, $7 FROM kategori k WHERE k.nama_kategori = $8
       ON CONFLICT (kode_barang) DO NOTHING`,
      [kode, nama, harga, stok, satuan, deskripsi, gambar, kategori],
    )
    inserted += res.rowCount
  }
  console.log(`✅ Barang: ${inserted} data baru`)

  // 4. Pengaturan toko
  for (const [key, value] of settings) {
    await client.query("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", [key, value])
  }
  console.log(`✅ Settings: ${settings.length} kunci`)

  // 5. Knowledge base chatbot
  const { rows } = await client.query("SELECT COUNT(*)::int AS n FROM knowledge_base")
  if (rows[0].n === 0) {
    for (const [kategori, judul, konten, kataKunci] of knowledgeBase) {
      await client.query(
        "INSERT INTO knowledge_base (kategori, judul, konten, kata_kunci) VALUES ($1, $2, $3, $4)",
        [kategori, judul, konten, kataKunci],
      )
    }
    console.log(`✅ Knowledge base: ${knowledgeBase.length} entri`)
  } else {
    console.log("✅ Knowledge base sudah terisi, dilewati")
  }

  console.log("\n🎉 Seed selesai. Login admin: admin / admin123")
}

main()
  .catch((err) => {
    console.error("❌ Error:", err.message)
    process.exitCode = 1
  })
  .finally(() => client.end())
