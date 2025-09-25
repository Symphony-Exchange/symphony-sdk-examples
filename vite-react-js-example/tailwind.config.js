/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Bricolage Grotesque"',
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        black: " #1b1d1e",
        redBright: "#0b2737",
        red: "#687273",
        pink: "#737d7d",
        pinkBeige: "#fc8d92",
        pinkWhite: " #fdd5d5",
        white: "#f2f2f2",
        grey: "#111416",

        redShadow: "#ff4b2b3a",
        pinkShadow: "#fc7f81b0",
        lightShadow: "#fdd5d509",
        headerWhiteShadow: "#e0e0e059",
        darkShadow: "#0000001e",
        pinkBox: "#fe6f565a",
        textShadowBlack: "#171717",

        success: "#17c964",
        successDark: "#0e793c",
        warning: "#f5a524",
        danger: "#f31260",

        //new colors
        redSymphony: "#A21D20",
        redSymphonyDark: "#350707",
        whiteSymphony: "#FFFFFF",

        // update
        mainRed: "#A21D20",
        mainRed2: "#350707",

        textOffWhite: "#E6E6E6",
        textWhite: "#EEEEEE",
        textGray: "#868080",

        bgBlack1: "#0E0E0F",
        bgBlack2: "#191616",
        bgBlack3: "#141414",
        bgBlack4: " #180000",

        bgGray1: "#1E1E1E",
        bgGray2: "#2F3031",
        bgGray3: "#565E5F",

        borderColor1: "#332E2E",
        borderColor2: "#A9B3B4",
      },
      boxShadow: {
        "box-shadow-md": "0px 2px 7px 3px rgba(0, 0, 0, 0.3)",
        "box-shadow-sm": "1px 3px 5px rgba(0, 0, 0, 0.3)",
        "box-shadow-red": "0px 0px 25px #A21D2017",
      },
      dropShadow: {
        custom: "0px 0px 25px #A21D2067",
      },
      screens: {
        "below-lg": { max: "819px" },
        "below-full": { max: "1300px" },
        "small-height": { raw: "(max-height: 1027px)" },
      },
    },
  },
};
