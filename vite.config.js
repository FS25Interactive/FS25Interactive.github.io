import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// This repo deploys as the GitHub Pages *user* site
// (https://fs25interactive.github.io/), i.e. the domain root, so base stays '/'
// (unlike the individual map repos, which are project sites under their own
// repo-name path).
export default defineConfig({
  base: '/',
  plugins: [tailwindcss()],
});
