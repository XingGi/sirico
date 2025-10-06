import google.generativeai as genai
import re

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
        model = genai.GenerativeModel('gemini-2.5-pro')

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
        model = genai.GenerativeModel('gemini-2.5-pro')

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
        model = genai.GenerativeModel('gemini-2.5-pro')

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
        model = genai.GenerativeModel('gemini-2.5-pro')

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
    
def analyze_assessment_with_gemini(form_data: dict, api_key: str) -> list | None:
    """
    Menganalisis data lengkap dari form asesmen untuk mengidentifikasi risiko.
    """
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-pro')

        # === Merangkai semua data form menjadi sebuah konteks yang kaya untuk AI ===
        konteks = f"""
        **Nama Proyek:**
        {form_data.get('nama_asesmen', 'Tidak ada')}

        **Informasi Perusahaan:**
        - Industri: {form_data.get('company_industry', 'Tidak ada')}
        - Tipe Perusahaan: {form_data.get('company_type', 'Tidak ada')}
        - Aset Perusahaan: {form_data.get('company_assets', 'Tidak ada')}
        - Mata Uang: {form_data.get('currency', 'Tidak ada')}
        - Batas Risiko (Risk Limit): {form_data.get('risk_limit', 'Tidak ada')}

        **Kategori Risiko yang Menjadi Fokus:**
        {form_data.get('risk_categories', 'Tidak ada')}

        **Konteks Proyek:**
        - Tujuan Proyek: {form_data.get('project_objective', 'Tidak ada')}
        - Regulasi Terkait: {form_data.get('relevant_regulations', 'Tidak ada')}
        - Departemen yang Terlibat: {form_data.get('involved_departments', 'Tidak ada')}
        - Tindakan yang Sudah Selesai: {form_data.get('completed_actions', 'Tidak ada')}

        **Konteks Risiko Tambahan:**
        {form_data.get('additional_risk_context', 'Tidak ada')}
        """

        prompt = f"""
        Anda adalah seorang Chief Risk Officer (CRO) yang sangat berpengalaman di sebuah perusahaan multinasional.
        Berdasarkan informasi proyek yang komprehensif di bawah ini, tugas Anda adalah:

        1.  Identifikasi 5 (lima) potensi risiko paling signifikan yang mungkin terjadi.
        2.  Untuk setiap risiko, berikan deskripsi singkat (1-2 kalimat) yang menjelaskan mengapa risiko tersebut relevan dengan konteks proyek.
        3.  Sajikan hasilnya HANYA dalam format berikut, pisahkan setiap entri dengan "---":
            NAMA_RISIKO_1: Deskripsi singkat risiko 1.
            ---
            NAMA_RISIKO_2: Deskripsi singkat risiko 2.
            ---
            NAMA_RISIKO_3: Deskripsi singkat risiko 3.
            ---
            ...dan seterusnya.

        JANGAN gunakan bullet points, penomoran, atau format lain. Pastikan nama risiko dan deskripsi dipisahkan oleh tanda titik dua (:).

        Berikut adalah konteks proyeknya:
        ---
        {konteks}
        ---
        """

        response = model.generate_content(prompt)
        
        print("--- RAW AI RESPONSE ---")
        print(response.text)
        print("-----------------------")
        
        # === Memproses hasil teks dari AI menjadi daftar yang terstruktur ===
        risks = []
        # Pola regex untuk memisahkan nama dan deskripsi
        pattern = re.compile(r"(.+?):(.+)")
        
        # Pisahkan setiap entri risiko berdasarkan "---"
        entries = response.text.strip().split('---')
        
        for entry in entries:
            if entry.strip():
                match = pattern.match(entry.strip())
                if match:
                    nama_risiko = match.group(1).strip()
                    deskripsi_risiko = match.group(2).strip()
                    risks.append({
                        "kode_risiko": "AI-" + nama_risiko.replace(" ", "_")[:15].upper(),
                        "deskripsi_risiko": f"{nama_risiko}: {deskripsi_risiko}"
                    })
        
        return risks

    except Exception as e:
        print(f"Error saat menganalisis asesmen dengan Gemini API: {e}")
        return None