/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "./node_modules/@tremor/react/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warna 'brand' utama kita (merah)
        "brand-red": "#DC2626", // Ini adalah kode hex untuk red-600
        "brand-red-dark": "#B91C1C", // red-700 untuk hover
      },
    },
  },
  // Tremor configuration
  tremor: {
    theme: {
      light: {
        colors: {
          // Atur warna utama Tremor agar sesuai dengan warna brand kita
          primary: "#DC2626", // brand-red
          "background-subtle": "#F1F5F9",
        },
      },
    },
  },
  plugins: [],
};
