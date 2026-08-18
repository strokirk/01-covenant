import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

// The site is served from https://<user>.github.io/01-covenant/, so assets
// need the repo name as a base path. Applied unconditionally — a base that
// only takes effect for `build` leaves dev and `vite preview` serving from
// `/`, which silently diverges from production.
export default defineConfig({
  base: '/01-covenant/',
  plugins: [solid()],
})
