import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/nfl-standings/',
  plugins: [vue()],
  server: {
    allowedHosts: ['mellis.io', 'www.mellis.io']
  }
})
