import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

// Project is served from https://<user>.github.io/01-covenant/, so assets
// need the repo name as a base path in production builds.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/01-covenant/' : '/',
  plugins: [solid()],
}))
