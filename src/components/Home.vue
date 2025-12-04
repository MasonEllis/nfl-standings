<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 transition-colors duration-300">
    <div class="w-full px-4 mx-auto">
      <!-- Header -->
      <div class="bg-white rounded-xl shadow-sm border mb-8 overflow-hidden">
        <div class="bg-gray-900 px-6 py-8 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
           <!-- Background Pattern -->
           <div class="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="white" stroke-width="2" fill="none"/>
                      </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
           </div>

          <div class="flex items-center space-x-4 md:space-x-6 relative z-10">
            <img 
              src="https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nfl.png" 
              alt="NFL Logo" 
              class="w-16 h-20 md:w-20 md:h-24 object-contain drop-shadow-lg"
            />
            <div class="text-center md:text-left">
              <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
                Standings <span class="text-blue-400">Predictor</span>
              </h1>
              <p class="text-blue-100 mt-1 font-medium text-sm md:text-base">
                Simulate the 2025 Season & Playoff Race
              </p>
            </div>
          </div>

          <!-- Conference Toggle (Moved inside Header) -->
          <div class="relative z-10 flex items-center gap-4">
            <!-- Dark Mode Toggle -->
            <button 
              @click="toggleDarkMode"
              class="p-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer relative z-20"
              title="Toggle Theme"
            >
              <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>

            <div class="bg-gray-800/50 backdrop-blur-sm p-2 rounded-xl border border-gray-700 flex items-center gap-4">
              <!-- AFC Logo -->
              <button
                @click="nflStore.setSelectedConference('AFC')"
                class="relative transition-all duration-300 hover:scale-105 focus:outline-none"
                :class="[
                  nflStore.selectedConference === 'AFC'
                    ? 'scale-110 opacity-100'
                    : 'opacity-50 hover:opacity-80 grayscale hover:grayscale-0'
                ]"
                title="Switch to AFC"
              >
                <img 
                  src="https://a.espncdn.com/i/teamlogos/nfl/500/afc.png" 
                  alt="AFC" 
                  class="w-12 h-12 object-contain drop-shadow-md"
                />
                <div 
                  v-if="nflStore.selectedConference === 'AFC'" 
                  class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                ></div>
              </button>

              <!-- Divider -->
              <div class="w-px h-8 bg-gray-600/50"></div>

              <!-- NFC Logo -->
              <button
                @click="nflStore.setSelectedConference('NFC')"
                class="relative transition-all duration-300 hover:scale-105 focus:outline-none"
                :class="[
                  nflStore.selectedConference === 'NFC'
                    ? 'scale-110 opacity-100'
                    : 'opacity-50 hover:opacity-80 grayscale hover:grayscale-0'
                ]"
                title="Switch to NFC"
              >
                <img 
                  src="https://a.espncdn.com/i/teamlogos/nfl/500/nfc.png" 
                  alt="NFC" 
                  class="w-12 h-12 object-contain drop-shadow-md"
                />
                <div 
                  v-if="nflStore.selectedConference === 'NFC'" 
                  class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                ></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Team Selection (Left) -->
        <div>
          <TeamSelector />
        </div>

        <!-- Team Schedule (Center) -->
        <div>
          <div v-if="nflStore.selectedTeam">
            <TeamSchedule />
          </div>
        </div>

        <!-- Playoff Picture (Right) -->
        <div>
          <PlayoffPicture />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNFLStore } from '../stores/nfl'
import TeamSelector from './TeamSelector.vue'
import TeamSchedule from './TeamSchedule.vue'
import PlayoffPicture from './PlayoffPicture.vue'
import { ref, onMounted } from 'vue'

const nflStore = useNFLStore()
const isDark = ref(false)

const toggleDarkMode = () => {
  console.log('Toggling dark mode. Current:', isDark.value)
  const html = document.documentElement
  
  // Explicitly check classList
  if (html.classList.contains('dark')) {
    html.classList.remove('dark')
    localStorage.theme = 'light'
    isDark.value = false
  } else {
    html.classList.add('dark')
    localStorage.theme = 'dark'
    isDark.value = true
  }
  console.log('New state:', isDark.value)
}

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
})
</script>
