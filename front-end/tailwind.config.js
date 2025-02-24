/** @type {import('tailwindcss').Config} */
import { mtConfig } from "@material-tailwind/react"
module.exports = {
  content: ["./src/**/*.{html,cjs,ts,tsx,jsx}","./node_modules/@material-tailwind/react/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [mtConfig],
}