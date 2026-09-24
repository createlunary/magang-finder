# Magang Finder — Frontend

Antarmuka "mission control" untuk pipeline pencarian magang otomatis
(scraping → dedup RAG → local LLM → ranking Claude).

## Tech stack

| Lapisan | Pakai |
|---|---|
| Bahasa | TypeScript (strict) |
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 (token warna di `app/globals.css`) |
| Komponen UI | shadcn/ui di atas Radix UI (`components/ui/`) |
| Ikon | lucide-react |
| Data | TanStack Query (`hooks/use-api.ts`) |
| Grafik | Recharts (Dashboard, Riwayat Run) |
| Runtime | Node.js 20+ (diuji dengan v24) |

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
```

Build produksi: `npm run build && npm start`. Cek tipe: `npm run typecheck`.

## Tiga mode

`lib/mode.ts` menentukan mode dari variabel lingkungan:

| Mode | Kapan | Data | Login |
|---|---|---|---|
| **lokal** | `NEXT_PUBLIC_API_URL` terisi (`auto` disarankan) | FastAPI di mesin lokal | Google, lewat jembatan showcase |
| **showcase** | `NEXT_PUBLIC_MODE=showcase` (Vercel) | `snapshot.json` publik, baca-saja | Tidak perlu |
| **demo** | Tidak ada keduanya | `lib/mock-data.ts` | Tidak perlu |

Contoh isian ada di `.env.example`.

### Showcase (publik)

Situs di Vercel tidak pernah menghubungi mesin lokal. Setelah setiap run atau Deep Search,
backend menjalankan `mf.py showcase`, yang mengekspor data yang boleh publik ke branch
`showcase-data` repo ini. Situs membaca `snapshot.json` dari sana (`NEXT_PUBLIC_SNAPSHOT_URL`),
jadi tetap online walau mesin lokal mati. `vercel.json` mencegah branch data memicu build.

Isi snapshot: lowongan, skor, alasan penilaian, profil perusahaan, laporan Deep Search,
statistik sumber, angka ringkas tiap run. **Tidak** ikut: catatan, status lamaran, chat,
profil & skill, pengaturan. Halaman Profil dan Pengaturan tidak ditampilkan; tombol yang
mengubah sesuatu disembunyikan.

Pratinjau lokal di port 3001: `npm run dev:showcase` (membaca `public/snapshot.json`).

### Panel lokal & login

`npm run dev:lan` (pengembangan) atau `npm run panel` (build produksi) mendengarkan di semua
antarmuka, jadi HP di WiFi yang sama bisa membuka `http://<IP-komputer>:3000`. API dijalankan
dengan `python scripts/api_dev.py --lan`.

Google tidak mengizinkan redirect OAuth ke alamat WiFi (`http://192.168.x.x`), jadi login
terjadi di situs showcase:

1. Panel → `<showcase>/api/masuk?kembali=http://192.168.x.x:3000/masuk`
2. Showcase → Google → `/api/masuk/callback`: cek email di `MF_EMAIL_IZIN`, lalu terbitkan
   tiket HMAC (`MF_JEMBATAN_SECRET`, umur 2 menit, sekali pakai).
3. Kembali ke panel dengan `#tiket=…` (fragmen URL, tidak terkirim ke server mana pun).
4. Panel menukar tiket ke API (`POST /auth/tukar`) dan mendapat token sesi 30 hari.

Alamat kembali hanya boleh localhost atau IP privat (`lib/jembatan.ts`), supaya tiket tidak
bisa dikirim ke server lain. API menolak klien di luar jaringan lokal dan mewajibkan token
untuk semua endpoint selain `/health` dan `/auth/*`.

## Kontrak endpoint FastAPI

Bentuk data mengikuti tipe di `lib/types.ts`.

| Method | Path | Body / query | Respons |
|---|---|---|---|
| GET | `/jobs` | `q, sources (csv), status, min_score, sort=skor\|deadline` | `Job[]` |
| GET | `/jobs/{id}` | – | `Job` |
| PATCH | `/jobs/{id}` | `{ status?, notes? }` | `Job` |
| GET | `/profile` | – | `Profile` |
| PUT | `/profile` | `Profile` tanpa `version/updatedAt` | `Profile` (versi naik, backend menjadwalkan penilaian ulang) |
| GET | `/sources` | – | `Source[]` |
| PATCH | `/sources/{key}` | `Partial<Source>` | `Source` |
| GET | `/settings` | – | `Settings` |
| PUT | `/settings` | `Settings` | `Settings` |
| GET | `/runs` | – | `RunRecord[]` (terbaru dulu) |
| POST | `/runs` | – | `{ ok: true }` — memulai run |
| GET | `/runs/current` | – | `RunProgress` — di-poll tiap 500 ms selama `running: true` |
| GET | `/dashboard/summary` | – | `DashboardSummary` |

Pencarian semantik (`q`) di mode mock hanya pencocokan kata. Di backend,
arahkan ke retrieval embedding dari RAG store.

FastAPI perlu CORS mengizinkan origin frontend (mis. `http://localhost:3000`).

## Struktur

```
app/
  page.tsx               Dashboard (radar orbit, sekuens pipeline, tren, rekomendasi)
  lowongan/page.tsx      Tabel + filter + pencarian semantik
  lowongan/[id]/page.tsx Detail, status, riwayat skor, catatan
  profil/                Editor profil dengan autosave
  sumber/                Toggle & kata kunci per situs
  pengaturan/            Ambang skor, backend ranking, model, kuota, jadwal
  riwayat/               Grafik & tabel metrik run
components/
  ui/                    Komponen shadcn/ui (bisa diubah bebas)
  dashboard/             OrbitRadar, LaunchPanel, TelemetryTicker, TrendChart, Countdown
  layout/                Sidebar, PageHeader, ThemeToggle
  shared/                ConsolePanel, badge skor/status, ListEditor
hooks/use-api.ts         Semua query & mutation TanStack Query
lib/                     api.ts, mock-data.ts, types.ts, utils.ts
```

## Menambah komponen shadcn

`components.json` sudah disiapkan, jadi CLI bisa dipakai langsung:

```bash
npx shadcn@latest add dialog
```

## Catatan desain

- **Dark mode default**, toggle di sidebar (next-themes, class-based).
- **Radar orbit**: jarak satelit dari pusat = pita skor (≥75, 50–74, <50 — sama dengan definisi di prompt ranking).
  Animasi murni CSS, bisa dijeda, dan otomatis dimatikan untuk pengguna
  dengan `prefers-reduced-motion`.
- Panel konsol gelap bertekstur dot-grid dipakai konsisten untuk area
  "operasional" (progres, filter, log analisis, ringkasan run).
- **Jaringan saraf** (Lowongan, `components/lowongan/neural-map.tsx`): skill → lowongan →
  perusahaan. Node diurutkan dengan barycenter supaya garis jarang bersilangan; sinyal
  bergerak lewat CSS `offset-path`; ketuk node untuk menyalakan jalurnya. Latar belakang
  perusahaan dari `/companies` (Deep Search, atau ringkasan Qwen dari halaman lowongan).
- **Konstelasi skill** (Profil): orbit dikuasai / pernah dipakai / gap; ukuran bintang =
  permintaan tertimbang skor; garis rasi = skill yang sering diminta bersama. Pencocokan
  skill ada di `lib/skills.ts` (dipakai bersama jaringan saraf).
- **Stasiun bumi** (Sumber): pita yang menyempit tautan → dibuka → relevan per sumber.
- **Panel kontrol** (Pengaturan): histogram skor yang bisa diseret untuk ambang, jam 24 jam
  dengan kenop jadwal yang bisa diputar.
- **Linimasa misi** (Riwayat): tiap run satu titik (besar = ditemukan, warna = jenis run).
- Semua animasi dimatikan untuk `prefers-reduced-motion`. Animasi masuk (`anim-rise`)
  tidak dipasang di elemen yang posisinya memakai `transform` atau yang opacity-nya
  dinamis — fill-mode animasi akan menimpa nilai itu.
