import google.generativeai as genai

def summarize_text_with_gemini(text_to_summarize: str, api_key: str) -> str | None:
    """
    Meringkas teks menggunakan Google Gemini API menjadi 3 poin.

    Args:
        text_to_summarize: Teks panjang yang akan diringkas.
        api_key: Kunci API untuk Google AI Studio.

    Returns:
        String berisi ringkasan dalam 3 poin, atau None jika terjadi error.
    """
    try:
        # Konfigurasi API key
        genai.configure(api_key=api_key)

        # Inisialisasi model
        model = genai.GenerativeModel('gemini-1.5-flash-latest')

        # Membuat prompt yang spesifik untuk AI
        prompt = f"""
        Anda adalah seorang analis risiko yang ahli. 
        Ringkas teks berikut menjadi tepat 3 (tiga) poin utama yang paling krusial. 
        Gunakan format bullet points (markdown) untuk setiap poin.

        Teks untuk diringkas:
        ---
        {text_to_summarize}
        ---
        """

        # Mengirim prompt ke model AI
        response = model.generate_content(prompt)

        # Mengembalikan hasil teks dari respons
        return response.text

    except Exception as e:
        # Penanganan error jika terjadi masalah saat memanggil API
        print(f"Error saat memanggil Gemini API: {e}")
        return None
    
def analyze_rsca_answers_with_gemini(all_answers_text: str, api_key: str) -> str | None:
    """
    Menganalisis kumpulan jawaban RSCA dan mengidentifikasi 3 kelemahan kontrol teratas.
    """
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash-latest')

        prompt = f"""
        Anda adalah seorang konsultan manajemen risiko senior dengan pengalaman puluhan tahun.
        Tugas Anda adalah menganalisis kumpulan jawaban dari sebuah Risk & Control Self-Assessment (RSCA) 
        dari berbagai departemen di sebuah perusahaan.

        Berdasarkan semua data jawaban berikut, identifikasi 3 (tiga) kelemahan kontrol (control weakness) 
        yang paling umum, signifikan, atau berulang di seluruh perusahaan.

        Sajikan temuan Anda sebagai ringkasan eksekutif dalam format bullet points. 
        Untuk setiap poin, jelaskan kelemahannya dan berikan contoh dari departemen mana saja yang menunjukkannya.

        Data Jawaban RSCA:
        ---
        {all_answers_text}
        ---
        """
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error saat menganalisis RSCA dengan Gemini API: {e}")
        return None
    
def suggest_risks_for_process_step(step_description: str, api_key: str) -> str | None:
    """
    Memberikan saran potensi risiko berdasarkan deskripsi sebuah langkah proses.
    """
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash-latest')

        prompt = f"""
        Anda adalah seorang konsultan manajemen risiko dan auditor internal yang sangat berpengalaman.
        Berdasarkan deskripsi singkat dari sebuah langkah dalam proses bisnis berikut, 
        identifikasi dan sebutkan 5 (lima) potensi risiko paling umum yang bisa terjadi.

        Sajikan hasilnya HANYA sebagai daftar nama risiko. Setiap nama risiko harus berada di baris baru.
        JANGAN gunakan bullet points, penomoran, atau karakter tambahan apa pun.

        Contoh output yang diinginkan:
        Risiko A
        Risiko B
        Risiko C
        Risiko D
        Risiko E

        Deskripsi Langkah Proses:
        ---
        {step_description}
        ---
        """
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        print(f"Error saat menyarankan risiko dengan Gemini API: {e}")
        return None
    
def analyze_bia_with_gemini(failed_asset_name: str, downtime: int, impacted_assets: list, kris: list, api_key: str) -> str | None:
    """
    Menganalisis dampak bisnis dari sebuah aset yang lumpuh menggunakan Gemini.
    """
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash-latest')

        # Format data yang dikumpulkan menjadi teks yang mudah dibaca AI
        impacted_assets_str = ", ".join(impacted_assets) if impacted_assets else "Tidak ada aset lain yang terdampak langsung."
        kri_str = "\n".join([f"- {kri['nama_kri']} (Batas Kritis: {kri['ambang_batas_kritis']})" for kri in kris]) if kris else "Tidak ada data KRI relevan yang tersedia."

        prompt = f"""
        Anda adalah seorang ahli Business Continuity dan konsultan manajemen risiko kelas dunia.
        Lakukan sebuah simulasi Business Impact Analysis (BIA).

        Skenario:
        - Aset Kritis yang Gagal: "{failed_asset_name}"
        - Estimasi Waktu Henti (Downtime): {downtime} jam
        - Aset Lain yang Terdampak (karena ketergantungan): {impacted_assets_str}
        - Key Risk Indicators (KRI) relevan untuk konteks finansial/operasional:
        {kri_str}

        Tugas Anda:
        Buat laporan analisis dampak yang ringkas namun informatif. Laporan harus memiliki dua bagian jelas:

        1.  **Analisis Dampak Kualitatif:** Jelaskan potensi dampak non-finansial dalam 3 poin utama. Fokus pada dampak terhadap operasional, reputasi perusahaan, dan kepuasan pelanggan.
        
        2.  **Estimasi Dampak Kuantitatif:** Berdasarkan skenario dan data KRI yang diberikan, berikan estimasi kasar (order-of-magnitude) mengenai potensi kerugian finansial. Jelaskan secara singkat bagaimana Anda sampai pada estimasi tersebut.

        Sajikan hasilnya dalam format Markdown dan table yang rapi.
        """
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        print(f"Error saat menganalisis BIA dengan Gemini API: {e}")
        return None