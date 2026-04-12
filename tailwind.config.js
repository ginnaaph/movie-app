/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#20265C",
        secondary: "#191981",
        accent: "#5F9EA0",
        slateGrey: "#708090",
        text: "#F8F8F8",
        accentLight: "#D47373",
      },
      extend: {},
    },
  },
  plugins: [],
};
