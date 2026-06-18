import { createSlice } from "@reduxjs/toolkit";


const defaultThemeSettings = {
  "data-bs-theme": "light",
  "data-sidebar": "light",
  "data-color": "primary",
  "data-topbar": "white",
  "data-layout": "default",
  "data-size": "default",
  "data-width": "fluid",
  "data-sidebarbg": "none",
  "dir": "ltr",
};


const initialState = {
  themeSettings: (() => {
    const stored = localStorage.getItem("themeSettings");
    let settings = stored ? JSON.parse(stored) : null;
    if (!settings) {
      settings = { ...defaultThemeSettings };
    }
    // Automatically migrate/cleanup user session settings to light defaults
    settings["data-bs-theme"] = "light";
    settings["data-sidebar"] = "light";
    settings["data-topbar"] = "white";
    localStorage.setItem("themeSettings", JSON.stringify(settings));
    return settings;
  })(),
};


const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    updateTheme: (state, { payload }) => {
      if (payload.dir === "rtl") {
        state.themeSettings = { ...defaultThemeSettings, dir: "rtl" };
      } else if (state.themeSettings.dir === "rtl" && payload.dir !== "rtl") {
        state.themeSettings = { ...defaultThemeSettings, ...payload, dir: "ltr" };
      } else {
        state.themeSettings = { ...state.themeSettings, ...payload };
      }


      localStorage.setItem(
        "themeSettings",
        JSON.stringify(state.themeSettings)
      );
    },
    resetTheme: (state) => {
      state.themeSettings = defaultThemeSettings;
      localStorage.removeItem("themeSettings");
    },
  },
});


export const { updateTheme, resetTheme } = themeSlice.actions;


export default themeSlice.reducer;





