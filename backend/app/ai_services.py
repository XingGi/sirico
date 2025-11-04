import google.generativeai as genai
import re
import json

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
    Menganalisis data lengkap dari form asesmen untuk menghasilkan Risk Register yang detail.
    """
    try:
        genai.configure(api_key=api_key)
        json_config = genai.GenerationConfig(response_mime_type="application/json")
        model = genai.GenerativeModel('gemini-2.5-pro', generation_config=json_config)

        konteks = f"""
        **Nama Proyek:** {form_data.get('nama_asesmen')}
        **Info Perusahaan:** Industri: {form_data.get('company_industry')}, Tipe: {form_data.get('company_type')}
        **Regulasi Terkait:** {form_data.get('relevant_regulations')}
        **Tujuan Proyek:** {form_data.get('project_objective')}
        **Konteks Tambahan:** {form_data.get('additional_risk_context')}
        """

        prompt = f"""
        Anda adalah seorang Chief Risk Officer (CRO) profesional. Berdasarkan konteks proyek di bawah ini, identifikasi 10 potensi risiko paling signifikan.
        Jawaban Anda HARUS berupa array JSON yang valid. Setiap objek dalam array harus memiliki kunci-kunci berikut: "title", "objective", "risk_type", "risk_description", "potential_cause", "potential_impact", "existing_control", "control_effectiveness", "inherent_likelihood", "inherent_impact", "mitigation_plan", "residual_likelihood", "residual_impact".

        - "title": (WAJIB) Buat judul risiko yang singkat dan deskriptif, maksimal 5-7 kata.
        - "objective" adalah tujuan dari mitigasi risiko.
        - "risk_type" harus salah satu dari: 'RP' (Risiko Pasar), 'RK' (Risiko Kepatuhan), 'RO' (Risiko Operasional), atau 'RR' (Risiko Reputasi).
        - "control_effectiveness" harus salah satu dari: 'Not Effective', 'Partially Effective', 'Fully Effective'.
        - Semua skor likelihood dan impact HARUS berupa angka integer antara 1 dan 5.
        - Semua field lain HARUS berupa string singkat dan jelas dalam Bahasa Indonesia.
        - JANGAN menyertakan kunci "kode_risiko" dalam output JSON Anda.
        - Pastikan outputnya adalah array JSON yang valid.

        Konteks Proyek:
        ---
        {konteks}
        ---
        """

        response = model.generate_content(prompt)
        
        print("--- RAW AI RESPONSE ---"); print(response.text); print("-----------------------")
        
        # cleaned_text = response.text.strip().replace('```json', '').replace('```', '')
        
        parsed_risks = json.loads(response.text)

        risks_for_db = []
        # Gunakan enumerate untuk mendapatkan 'i' (index)
        for i, risk in enumerate(parsed_risks): 
            risk_type_prefix = risk.get('risk_type', 'XX').upper()
            # kode_risiko = f"{risk_type_prefix}{str(i+1).zfill(3)}"
            
            risks_for_db.append({
                "title": risk.get('title'),
                # "kode_risiko": kode_risiko,
                "objective": risk.get('objective'),
                "risk_type": risk.get('risk_type'),
                "deskripsi_risiko": risk.get('risk_description'),
                "risk_causes": risk.get('potential_cause'),
                "risk_impacts": risk.get('potential_impact'),
                "existing_controls": risk.get('existing_control'),
                "control_effectiveness": risk.get('control_effectiveness'),
                "inherent_likelihood": risk.get('inherent_likelihood'),
                "inherent_impact": risk.get('inherent_impact'),
                "mitigation_plan": risk.get('mitigation_plan'),
                "residual_likelihood": risk.get('residual_likelihood'),
                "residual_impact": risk.get('residual_impact'),
            })
        return risks_for_db

    except Exception as e:
        print(f"Error saat menganalisis asesmen dengan Gemini API: {e}")
        return None
    
def generate_detailed_risk_analysis_with_gemini(risks: list, api_key: str) -> dict | None:
    """
    Menganalisis daftar risiko dan menghasilkan laporan multi-bagian yang mendalam.
    """
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-pro')

        risk_details = ""
        for r in risks:
            likelihood = r.get('inherent_likelihood') or 0
            impact = r.get('inherent_impact') or 0
            risk_level_score = likelihood * impact
            risk_details += f"- Kode: {r.get('kode_risiko')}, Deskripsi: {r.get('deskripsi_risiko')} (Level Inherent: {risk_level_score}, Tipe: {r.get('risk_type')})\n"

        prompt = f"""
        Anda adalah seorang Chief Risk Officer (CRO) virtual kelas dunia. Anda sedang menyiapkan laporan analisis risiko untuk dewan direksi.
        Berdasarkan daftar risiko yang telah diidentifikasi berikut ini:
        ---
        {risk_details}
        ---
        Buatlah laporan analisis yang komprehensif. Jawaban Anda HARUS berupa sebuah objek JSON tunggal yang valid tanpa markdown.
        Objek JSON tersebut harus memiliki kunci-kunci berikut: "executive_summary", "risk_profile_analysis", "immediate_priorities", "critical_risks_discussion", "implementation_plan", "next_steps".

        Ikuti instruksi detail untuk setiap kunci:
        1. "executive_summary": (string) Tulis paragraf kesimpulan umum (4-5 kalimat) tentang lanskap risiko proyek ini.
        2. "risk_profile_analysis": (object) Buat objek dengan dua kunci: "summary" (sebuah paragraf string yang menganalisis distribusi risiko) dan "distribution" (sebuah objek yang berisi jumlah risiko untuk setiap level, contoh: {{"High": 2, "Moderate to High": 3, ...}}).
        3. "immediate_priorities": (array of strings) Identifikasi 3 area prioritas teratas yang memerlukan tindakan segera, sajikan sebagai array string.
        4. "critical_risks_discussion": (array of objects) Pilih 2 risiko paling kritis dari daftar. Untuk setiap risiko, buat objek dengan kunci: "risk_code" (string), "discussion" (paragraf string yang membahas mengapa risiko ini kritis), dan "mitigation_target" (string, contoh: "Target mitigasi ini adalah Q2 2026.").
        5. "implementation_plan": (array of strings) Buat daftar 4 langkah implementasi mitigasi yang paling penting, beri target kuartal (contoh: "Q1 2026: Lakukan audit keamanan siber menyeluruh.").
        6. "next_steps": (string) Tulis satu paragraf berisi rekomendasi langkah selanjutnya yang lebih bersifat umum dan strategis.
        """

        response = model.generate_content(prompt)
        
        try:
            match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if match:
                json_string = match.group(0)
                analysis_result = json.loads(json_string)
                return analysis_result
            else:
                return None
        except (json.JSONDecodeError, TypeError):
            print("Peringatan: Gagal mem-parse output dari AI untuk analisis detail. Output mentah:")
            print(response.text)
            return None

    except Exception as e:
        print(f"Error saat membuat analisis detail dengan Gemini API: {e}")
        return None