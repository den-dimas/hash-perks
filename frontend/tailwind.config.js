// File: ./frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // New Light Theme Palette
        "light-bg-primary": "#F8F9FA", // Very light grey/off-white for main background
        "light-bg-secondary": "#FFFFFF", // Pure white for cards/sections
        "light-text-primary": "#212529", // Dark grey for primary text
        "light-text-secondary": "#6C757D", // Muted grey for secondary text

        // Vibrant Green Accent
        "accent-green": "#28A745", // A strong, vibrant green
        "accent-green-light": "#2ECC71", // Lighter shade of green
        "accent-green-dark": "#1E8449", // Darker shade of green

        // Complementary Accent (e.g., for links, subtle highlights)
        "accent-blue-light": "#007BFF", // A standard vibrant blue
        "accent-blue-dark": "#0056B3",

        // Status Colors (adjust as needed for light theme visibility)
        "status-success": "#28A745", // Green
        "status-error": "#DC3545", // Red
        "status-info": "#007BFF", // Blue
      },
      backgroundImage: {
        // Subtle gradient for hero sections in light mode
        "hero-gradient-light": "linear-gradient(180deg, #E0F7FA 0%, #B2EBF2 100%)", // Light blue gradient
      },
      borderRadius: {
        xl: "0.75rem", // Slightly less rounded than previous, more elegant
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        // Subtle, elegant shadows for light mode
        "subtle-shadow": "0 4px 12px rgba(0, 0, 0, 0.08)",
        "medium-shadow": "0 8px 20px rgba(0, 0, 0, 0.12)",
        "large-shadow": "0 12px 30px rgba(0, 0, 0, 0.15)",
        // No glowing effects as requested
      },
      animation: {
        // Keep existing animations if they don't rely on glow effects
        "gradient-bg-animation": "gradient-bg 10s ease infinite alternate",
        // Remove "pulse-glow" as glowing is not desired
      },
      keyframes: {
        "gradient-bg": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [],
};
