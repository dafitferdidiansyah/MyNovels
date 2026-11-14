# EPUB Downloader - Local ePub Library & Direct Downloader

Aplikasi web ePub Downloader berbasis direktori lokal dengan antarmuka UI/UX WTR-Lab Clone dan backend Django REST Framework.

## Arsitektur Proyek
- **Backend (`/backend`)**:
  - Framework: Django 6 + Django REST Framework + SQLite
  - Metadata Extractor: Parser Dublin Core XML & Cover extractor langsung dari ZIP container ePub
  - Endpoint Aman: `/api/books/{id}/download/` (Streaming file via `FileResponse` tanpa membocorkan path server, auto tracking unduhan)
  - Scanner CLI: `python manage.py scan_epubs <folder_path>`
  - Scanner API: `POST /api/scan/`
- **Frontend (`/frontend`)**:
  - Framework: React 19 + Vite + Tailwind CSS v4
  - Desain: Mengadopsi CSS/HTML WTR-Lab Clone (Dark mode, responsive grid, card zoom effect, tags)
  - Fitur:
    - Search Bar responsif (live debounced search)
    - Filter berdasarkan Genre & Sorting (Terbaru, Paling Banyak Diunduh, Judul A-Z, Ukuran)
    - Skeleton loading animasi saat mengambil data
    - Direct download button & Modal pratinjau detail buku
    - Trigger pemindaian folder langsung dari modal antarmuka

---

## Acknowledgements & Credits

Proyek ini menghargai etika atribusi open-source dan mengapresiasi karya kreator terkait:
- **UI & Layout Inspiration**: Desain card layout novel terinspirasi oleh proyek [lara-novelku](https://github.com/taufiq-azr/lara-novelku) oleh [@taufiq-azr](https://github.com/taufiq-azr).
- **Novel Crawler & Pipeline**: Mengadopsi standar arsitektur crawling dari [lncrawl/lightnovel-crawler](https://github.com/lncrawl/lightnovel-crawler) dan [bookfere/Ebook-Translator-Calibre-Plugin](https://github.com/bookfere/Ebook-Translator-Calibre-Plugin).

> *Disclaimer*: Hak cipta tema dan desain asli tetap dimiliki oleh masing-masing pencipta. Proyek ini ditujukan untuk arsip pembaca pribadi dan riset teknis antarmuka.

---

## Cara Menjalankan

### Cara Cepat (Windows)
Cukup jalankan file:
```cmd
start.bat
```

### Manual

#### 1. Backend
```bash
cd backend
.venv\Scripts\activate
# Pindai folder epub (misal folder Downloads)
python manage.py scan_epubs "C:\Users\<User_Name>\Downloads"
# Jalankan server
python manage.py runserver 0.0.0.0:8000
```

#### 2. Frontend
```bash
cd frontend
npm run dev
```
Akses di browser: `http://localhost:5174`
