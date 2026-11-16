# elzjokikontak

Halaman kirim chat WhatsApp satu per satu (satu tap = satu chat terbuka).

## File
- `index.html` : halaman utama (tombol KIRIM)
- `panel.html` : panel admin (tambah nomor, ubah pesan)
- `api/[a].js` : API (semua endpoint dalam satu file)

## Deploy ke Vercel
1. Import repo ini di vercel.com/new, lalu Deploy.
2. Tab Storage: buat Upstash Redis dan hubungkan ke project.
3. Settings > Environment Variables: tambah `PANEL_PASS` (password panel).
4. Redeploy.

## Cek
- `/api/status` harus menampilkan JSON.
- `/panel.html` untuk mengisi nomor.
