import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,   // bind to 0.0.0.0 so mobile devices on LAN can connect
  },
});
