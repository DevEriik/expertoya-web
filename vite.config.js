import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, //Critico para que docker pueda exponer el puerto hacia afuera.
    watch: {
      usePolling: true, // Ayuda a que Docker detecte los cambios en los archivos en Linux
    },
  },
});
