import os
import feedparser
from datetime import datetime
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Setup untuk bisa mengakses database Flask
from app import create_app, db
from app.models import HorizonScanEntry
from app.ai_services import summarize_text_with_gemini

# Inisialisasi aplikasi Flask untuk mendapatkan konteks database
app = create_app()

def clean_html(raw_html):
    """Membersihkan tag HTML dari teks."""
    soup = BeautifulSoup(raw_html, "html.parser")
    return soup.get_text()

def run_scanner():
    """Fungsi utama untuk menjalankan pemindaian berita."""
    print("--- Memulai Horizon Scanner ---")
    
    load_dotenv()
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    if not gemini_api_key:
        print("Error: GEMINI_API_KEY tidak ditemukan. Hentikan scanner.")
        return

    # Kita akan menggunakan RSS Feed dari CNBC Indonesia sebagai sumber berita
    RSS_URL = "https://www.cnbcindonesia.com/news/rss"
    
    feed = feedparser.parse(RSS_URL)
    
    # Ambil 5 berita teratas
    for entry in feed.entries[:5]:
        with app.app_context(): # <-- Butuh konteks aplikasi untuk akses DB
            # Cek apakah berita sudah ada di DB berdasarkan URL
            exists = HorizonScanEntry.query.filter_by(source_url=entry.link).first()
            if exists:
                print(f"-> Berita '{entry.title}' sudah ada, dilewati.")
                continue

            print(f"\nMemproses berita: {entry.title}")
            
            # Membersihkan deskripsi dari HTML
            cleaned_summary = clean_html(entry.summary)
            
            # Minta AI untuk meringkas
            print("   Mengirim ke AI untuk diringkas...")
            ai_summary = summarize_text_with_gemini(cleaned_summary, gemini_api_key)

            if ai_summary:
                print("   Ringkasan AI diterima.")
                # Konversi tanggal berita ke format yang benar
                published_dt = datetime.strptime(entry.published, '%a, %d %b %Y %H:%M:%S %z')

                # Buat entri baru untuk disimpan ke database
                new_entry = HorizonScanEntry(
                    title=entry.title,
                    source_url=entry.link,
                    published_date=published_dt,
                    original_summary=cleaned_summary,
                    ai_summary=ai_summary
                )
                db.session.add(new_entry)
                db.session.commit()
                print(f"   SUKSES: Berita '{entry.title}' disimpan ke database.")
            else:
                print(f"   GAGAL: Tidak bisa mendapatkan ringkasan AI untuk '{entry.title}'.")

    print("\n--- Horizon Scanner Selesai ---")

if __name__ == "__main__":
    run_scanner()