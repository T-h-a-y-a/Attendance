import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // default warning is 500 kB
    chunkSizeWarningLimit: 100000, // increase to 1.5 MB (adjust as you want)
  },
});
