<template>
  <div :class="[
    'relative overflow-hidden rounded-lg shadow-sm border p-6 transition-colors duration-500',
    nflStore.selectedConference === 'AFC' 
      ? 'bg-red-50/80 border-red-200 dark:bg-red-950/20 dark:border-red-800/50' 
      : 'bg-blue-50/80 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/50'
  ]">
    <!-- Strong Top Gradient Bar -->
    <div :class="[
      'absolute top-0 left-0 right-0 h-1.5 w-full z-10',
      nflStore.selectedConference === 'AFC' ? 'bg-red-500' : 'bg-blue-500'
    ]"></div>

    <h2 class="relative text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3 pt-2">
      <div class="relative w-12 h-12 flex items-center justify-center">
        <img 
          v-if="nflStore.selectedConference === 'AFC'"
          src="https://a.espncdn.com/i/teamlogos/nfl/500/afc.png"
          alt="AFC Logo"
          class="w-full h-full object-contain drop-shadow-md"
        />
        <img 
          v-else
          src="https://a.espncdn.com/i/teamlogos/nfl/500/nfc.png"
          alt="NFC Logo"
          class="w-full h-full object-contain drop-shadow-md"
        />
      </div>
      <span>Playoff Picture</span>
    </h2>
    
    <div class="relative flex flex-col gap-8">
      <!-- Playoff Teams -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">Seeding</h3>
          <span class="text-sm text-gray-500 dark:text-gray-400">Top 7 Qualify</span>
        </div>
        
        <div class="space-y-3">
          <div
            v-for="seed in playoffPicture.seeds"
            :key="seed.seed"
            :class="[
              'group relative flex items-center justify-between p-3 pr-4 rounded-xl border transition-all duration-200 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600',
              seed.seed === 1 
                ? 'border-amber-300 dark:border-amber-700/50 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10' 
                : seed.seed <= 4
                  ? 'border-emerald-200 dark:border-emerald-900/30 bg-gradient-to-r from-emerald-50/30 to-transparent dark:from-emerald-900/10'
                  : 'border-blue-200 dark:border-blue-900/30 bg-gradient-to-r from-blue-50/30 to-transparent dark:from-blue-900/10',
              seed.team.id === nflStore.selectedTeam ? 'ring-2 ring-blue-500 z-10' : ''
            ]"
          >
            <!-- Rank & Status Indicator -->
            <div class="flex items-center gap-6">
              <!-- Modern Geometric Seed Indicator -->
              <div class="flex items-center justify-center">
                <div :class="[
                  'flex items-center justify-center w-8 h-8 text-lg font-bold rounded font-mono',
                  seed.seed === 1 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' 
                    : seed.seed <= 4 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                ]">
                  {{ seed.seed }}
                </div>
              </div>

              <!-- Team Info -->
              <div class="flex items-center gap-4">
                <img :src="nflStore.getTeamLogoUrl(seed.team.id)" :alt="seed.team.name" class="w-12 h-12 object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200" />
                
                <div>
                  <div class="flex items-center gap-2">
                    <span :class="['font-bold text-lg leading-tight', seed.seed <= 4 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300']">{{ seed.team.city }}</span>
                    <span class="font-medium text-gray-500 dark:text-gray-400 text-lg leading-tight hidden sm:inline">{{ seed.team.name }}</span>
                    
                    <!-- Status Badges (Inline) -->
                    <span v-if="seed.seed === 1" class="ml-2 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                      Clinched Bye
                    </span>
                    <span v-else-if="seed.seed <= 4" class="ml-2 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded">
                      Div Leader
                    </span>
                    <span v-else class="ml-2 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded">
                      Wild Card
                    </span>
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-1">
                    <span class="font-mono font-medium text-gray-700 dark:text-gray-300">{{ seed.team.wins }}-{{ seed.team.losses }}{{ seed.team.ties > 0 ? `-${seed.team.ties}` : '' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Win % Badge -->
            <div class="hidden sm:block text-right">
               <div class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Win %</div>
               <div class="font-bold text-gray-900 dark:text-white font-mono">{{ (seed.team.winPercentage * 100).toFixed(1) }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- In the Hunt & Eliminated -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- In the Hunt -->
        <div v-if="playoffPicture.inTheHunt.length > 0">
          <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            In the Hunt
          </h3>
          <div class="space-y-2">
            <div
              v-for="team in playoffPicture.inTheHunt"
              :key="team.id"
              :class="[
                'flex items-center justify-between p-2.5 rounded-lg border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors',
                team.id === nflStore.selectedTeam ? 'ring-2 ring-blue-500' : ''
              ]"
            >
              <div class="flex items-center gap-3">
                <img :src="nflStore.getTeamLogoUrl(team.id)" :alt="team.name" class="w-8 h-8 object-contain" />
                <div>
                  <div class="font-semibold text-gray-900 dark:text-white text-sm">{{ team.city }}</div>
                  <div class="text-xs text-gray-500">{{ team.wins }}-{{ team.losses }}{{ team.ties > 0 ? `-${team.ties}` : '' }}</div>
                </div>
              </div>
              <div class="text-xs font-mono text-gray-500">{{ (team.winPercentage * 100).toFixed(0) }}%</div>
            </div>
          </div>
        </div>

        <!-- Eliminated -->
        <div v-if="playoffPicture.eliminated.length > 0">
          <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></span>
            Eliminated
          </h3>
          <div class="space-y-2">
            <div
              v-for="team in playoffPicture.eliminated"
              :key="team.id"
              :class="[
                'flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors opacity-75 hover:opacity-100',
                team.id === nflStore.selectedTeam ? 'ring-2 ring-blue-500 opacity-100' : ''
              ]"
            >
              <div class="flex items-center gap-3">
                <img :src="nflStore.getTeamLogoUrl(team.id)" :alt="team.name" class="w-8 h-8 object-contain" />
                <div>
                  <div class="font-medium text-gray-500 dark:text-gray-400 text-sm">{{ team.city }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ team.wins }}-{{ team.losses }}{{ team.ties > 0 ? `-${team.ties}` : '' }}</div>
                </div>
              </div>
              <div class="text-xs font-mono text-gray-500 dark:text-gray-400">{{ (team.winPercentage * 100).toFixed(0) }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Playoff Format Info Footer -->
    <div class="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        <span>#1 Seed (Bye)</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full border-2 border-emerald-500"></span>
        <span>Division Winners</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full border-2 border-blue-500"></span>
        <span>Wild Card</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNFLStore } from '../stores/nfl'

const nflStore = useNFLStore()

const playoffPicture = computed(() => {
  return nflStore.getPlayoffPicture(nflStore.selectedConference)
})
</script>
