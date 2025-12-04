<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-6 transition-colors duration-300">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Select Team</h2>
    
    <div class="space-y-4">
      <!-- Conference Teams -->
      <div v-for="division in divisions" :key="division" class="space-y-2">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wide">
          {{ nflStore.selectedConference }} {{ division }}
        </h3>
        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="team in getTeamsByDivision(division)"
            :key="team.id"
            @click="nflStore.setSelectedTeam(team.id)"
            :class="[
              'relative text-left p-3 rounded-md border transition-colors duration-200',
              nflStore.selectedTeam === team.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                : nflStore.isTeamEliminated(team.id)
                  ? 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'
            ]"
          >
            <div class="flex justify-between items-center" :class="{ 'opacity-60': nflStore.isTeamEliminated(team.id) }">
              <div class="flex items-center space-x-3">
                <img 
                  :src="nflStore.getTeamLogoUrl(team.id)" 
                  :alt="team.name" 
                  :class="['w-10 h-10 object-contain', nflStore.isTeamEliminated(team.id) ? 'grayscale' : '']" 
                />
                <div>
                  <div class="font-medium">{{ team.city }} {{ team.name }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    {{ team.abbreviation }}
                    <span v-if="nflStore.isTeamEliminated(team.id)" class="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-1.5 rounded">Eliminated</span>
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium">
                  {{ team.wins }}-{{ team.losses }}{{ team.ties > 0 ? `-${team.ties}` : '' }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ (team.winPercentage * 100).toFixed(1) }}%
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNFLStore } from '../stores/nfl'

const nflStore = useNFLStore()

const divisions = ['North', 'South', 'East', 'West']

const getTeamsByDivision = (division: string) => {
  const conferenceTeams = nflStore.selectedConference === 'AFC' 
    ? nflStore.afcStandings 
    : nflStore.nfcStandings
  
  return conferenceTeams.filter(team => team.division === division)
}
</script>
