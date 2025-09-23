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