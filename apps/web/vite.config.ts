import solid from "solid-start/vite";
import { defineConfig } from "vite";
import windiCSS from "vite-plugin-windicss";

export default defineConfig({
  plugins: [windiCSS(), solid()],
});
