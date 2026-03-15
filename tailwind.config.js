/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#456478",
        secondary: "#0F555A",
        accent: "#E77023",
        text: "#263743",
        "accent-light": "#88A0B0",
      },
      extend: {},
    },
  },
  plugins: [],
};
