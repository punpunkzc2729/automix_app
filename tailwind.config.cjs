const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: ["class"],
  content: [
    "./src/renderer/**/*.{ts,tsx,js,jsx}",
    "./src/shared/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      colors: {
        background: "rgb(12, 12, 16)",
        foreground: "rgb(245, 245, 247)",
        muted: "rgb(28, 28, 36)",
        accent: "rgb(56, 130, 246)",
        danger: "rgb(255, 98, 71)",
        success: "rgb(16, 185, 129)"
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans]
      },
      boxShadow: {
        deck: "0 20px 45px rgba(0,0,0,0.35)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
