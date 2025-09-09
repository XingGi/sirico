// Pastikan tidak ada import lain seperti './App.css'
// import './App.css' <-- Hapus atau beri komentar baris ini jika ada

function App() {
  return (
    // Kita beri background gelap ke seluruh halaman
    <div className="bg-slate-800 text-white min-h-screen flex items-center justify-center">
      {/* Kita beri style pada judul utama */}
      <h1 className="text-5xl font-bold underline text-cyan-400">SIRICO Berhasil Terpasang!</h1>
    </div>
  );
}

export default App;
