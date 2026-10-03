import { defineConfig } from 'vite';

// GitHub Pages serves the site from /glasstown/; locally and elsewhere it lives at /.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
});
