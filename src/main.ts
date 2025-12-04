import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import Home from './components/Home.vue'

// Initialize Theme immediately to avoid FOUC and race conditions
const initTheme = () => {
  if (localStorage.theme === 'dark' || (!('theme' in localStorage))) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
initTheme()

const routes = [
  { path: '/', component: Home }
]

const router = createRouter({
  history: createWebHistory('/nfl-standings/'),
  routes
})

const pinia = createPinia()

createApp(App)
  .use(pinia)
  .use(router)
  .mount('#app')
