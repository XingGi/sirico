sirico-dev/ ├── backend/ │ ├── app/ │ │ ├── routes/ # API Blueprints (Auth, Admin, BIA, BPR, dll) │ │ ├── init.py # Inisialisasi aplikasi Flask & blueprints │ │ ├── ai_services.py # Logika integrasi Google Gemini │ │ ├── models.py # Skema database SQLAlchemy │ │ └── seeds.py # Data awal (roles, permissions, master data) │ ├── migrations/ # Folder Alembic untuk migrasi database │ ├── uploads/ # Tempat file (regulasi, gambar struktur) diunggah │ ├── .env # (Perlu dibuat) Kunci API dan koneksi DB │ ├── run.py # Entry point untuk menjalankan server Flask │ └── run_seeds.py # Skrip untuk menjalankan database seeder │ └── frontend/ ├── public/ # Aset statis ├── src/ │ ├── api/ # Konfigurasi Axios (api.js) │ ├── components/ # Komponen UI umum (Layout, Sidebar, dll) │ ├── context/ # AuthContext (Manajemen state JWT) │ ├── features/ # Komponen utama yang dikelompokkan per modul │ │ ├── account/ │ │ ├── admin/ │ │ ├── bia/ │ │ ├── bpr/ │ │ ├── dashboard/ │ │ ├── landing/ │ │ ├── risk-ai/ │ │ ├── risk-management/ │ │ └── rsca/ │ ├── App.jsx # Definisi semua rute aplikasi │ └── main.jsx # Entry point aplikasi React ├── .env.example # Contoh variabel lingkungan (URL API) └── package.json # Dependensi frontend

Untuk menerapkan migrasi ke database:

Seeding Data Awal
Proyek ini memerlukan data awal (seed) agar dapat berfungsi dengan baik, terutama untuk Roles, Permissions, dan Master Data.

Skrip run_seeds.py akan secara otomatis mengisi:

Permissions: Semua izin granular (mis. view_risk_dasar, manage_users).

Roles: Role "Admin" (dengan semua izin) dan "User" (dengan izin dasar).

Admin User: Akun admin default (admin@admin.com / 12345678).

Master Data: Opsi untuk dropdown (Industri, Tipe Perusahaan, Aset Perusahaan, Mata Uang).

Risk Map Templates: Template Peta Risiko default ("Default SIRICO Matrix 5x5" dan "Default BUMN").

🧭 Modul & Fungsionalitas
Berikut adalah penjelasan lebih rinci tentang cara kerja beberapa modul utama:

Risk Management AI
Modul ini adalah fitur unggulan SIRICO.

Assessment Studio: Pengguna mengisi formulir CreateAssessmentForm dengan konteks proyek (tujuan, industri, regulasi, dll).

AI Analysis: Saat disubmit, data dikirim ke endpoint /api/assessments/analyze.

Gemini Service: Backend memanggil fungsi analyze_assessment_with_gemini, yang menginstruksikan Google Gemini untuk bertindak sebagai CRO (Chief Risk Officer) dan menghasilkan 10 risiko paling signifikan dalam format JSON.

Database: Hasil JSON dari AI disimpan ke tabel RiskAssessment dan RiskRegister.

Detail Page: Pengguna diarahkan ke AssessmentDetailPage, di mana mereka dapat melihat, mengedit (EditRiskItemSidebar), dan mengelola risiko yang dihasilkan AI.

Import: Risiko yang sudah final dapat diimpor ke MainRiskRegister.

Risk Management Levels (Dasar & Madya)
Menyediakan alur kerja manual untuk asesmen.

Modul Dasar: Dibuat berdasarkan formulir BasicAssessmentFormPage, mengikuti 3 tugas utama: Penetapan Konteks, Identifikasi Risiko, dan Analisis Risiko, yang kemudian dapat diekspor ke Excel.

Modul Madya: Alur yang lebih kompleks. Pengguna pertama-tama memilih RiskMapTemplate. Kemudian, pada MadyaAssessmentFormPage, mereka mengisi 5 kartu:

StrukturOrganisasiCard: Mendefinisikan unit kerja.

MadyaCriteriaReference: Referensi kriteria (statis).

SasaranKPIAppetiteCard: Mendefinisikan KPI dan target risk appetite.

RiskInputCard: Formulir input risiko utama yang terhubung ke Sasaran dan Unit Kerja.

RiskMapCard: Visualisasi otomatis risiko (Inherent & Residual) pada Peta Risiko yang dipilih.

Modul GRC (RSCA, BPR, BIA)
RSCA: Admin membuat siklus dan pertanyaan. Pengguna dari departemen terkait (dilihat dari user.department_id) mengisi kuesioner. AI dapat dipanggil untuk menganalisis semua jawaban dan menemukan kelemahan.

BPR: Pengguna memetakan proses bisnis dan langkah-langkahnya (ProcessStepNode). AI dapat memberikan saran potensi risiko untuk setiap langkah.

BIA: Pengguna mendefinisikan Aset Kritis (CriticalAsset) dan dependensinya. AI dapat menjalankan simulasi (analyze_bia_with_gemini) untuk memprediksi dampak kualitatif dan kuantitatif jika sebuah aset gagal.

Admin Panel
Area khusus (/admin/\*) yang dilindungi oleh admin_required decorator dan ProtectedRoute.

Member Management: Menggunakan EditUserModal dan AddUserModal untuk mengelola pengguna, role, dan batasan penggunaan (limits) asesmen.

Role & Permission: Mengelola peran dan izin granular yang terhubung melalui tabel role_permissions.

🤝 Kontribusi
Kontribusi sangat kami harapkan! Jika Anda memiliki ide untuk perbaikan atau menemukan bug, silakan:

Fork Proyek ini

Buat Branch Fitur Anda (git checkout -b feature/FiturBaru)

Commit Perubahan Anda (git commit -m 'Menambahkan FiturBaru')

Push ke Branch (git push origin feature/FiturBaru)

Buka Pull Request

📜 Lisensi
Didistribusikan di bawah Lisensi MIT. Anda perlu menambahkan file LICENSE sendiri jika belum ada.

📬 Kontak
Nama Proyek: [Nama Anda/Organisasi] - (email@anda.com)

Link Proyek:
