<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-6 transition-colors duration-300">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Select Team</h2>
      <!-- Division / Conference toggle -->
      <div class="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 text-xs">
        <button
          type="button"
          class="px-3 py-1 rounded-lg font-medium transition-colors"
          :class="viewMode === 'division'
            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'"
          @click="viewMode = 'division'"
        >
          Division
        </button>
        <button
          type="button"
          class="px-3 py-1 rounded-lg font-medium transition-colors"
          :class="viewMode === 'conference'
            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'"
          @click="viewMode = 'conference'"
        >
          Conference
        </button>
      </div>
    </div>

    <!-- Division view (existing UI) -->
    <div v-if="viewMode === 'division'" class="space-y-4">
      <div v-for="division in divisions" :key="division" class="space-y-2">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wide">
          {{ nflStore.selectedConference }} {{ division }}
        </h3>
        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="team in getTeamsByDivision(division)"
            :key="team.id"
            @click="nflStore.setSelectedTeam(team.id)"
            :class="teamButtonClass(team.id)"
          >
            <div class="flex justify-between items-center">
              <div class="flex items-center space-x-3">
                <img 
                  :src="nflStore.getTeamLogoUrl(team.id)" 
                  :alt="team.name" 
                  class="w-10 h-10 object-contain"
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

    <!-- Conference view: all teams in selected conference ordered by full conference standings (with tiebreakers) -->
    <div v-else class="space-y-2">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wide">
        {{ nflStore.selectedConference }} Conference
      </h3>
      <div class="grid grid-cols-1 gap-2">
        <button
          v-for="team in conferenceStandings"
          :key="team.id"
          @click="nflStore.setSelectedTeam(team.id)"
          :class="teamButtonClass(team.id)"
        >
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-3">
              <img 
                :src="nflStore.getTeamLogoUrl(team.id)" 
                :alt="team.name" 
                class="w-10 h-10 object-contain"
              />
              <div>
                <div class="font-medium">{{ team.city }} {{ team.name }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  {{ team.abbreviation }}
                  <span
                    v-if="isEliminatedInSelectedConference(team.id)"
                    class="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-1.5 rounded"
                  >
                    Eliminated
                  </span>
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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNFLStore } from '../stores/nfl'

const nflStore = useNFLStore()

const divisions = ['North', 'South', 'East', 'West']

type ViewMode = 'division' | 'conference'
const viewMode = ref<ViewMode>('division')

const conferenceStandings = computed(() =>
  nflStore.selectedConference === 'AFC'
    ? nflStore.afcConferenceStandings
    : nflStore.nfcConferenceStandings
)

const playoffPicture = computed(() =>
  nflStore.getPlayoffPicture(nflStore.selectedConference)
)

const eliminatedIds = computed(() => {
  const ids = new Set<string>()
  playoffPicture.value.eliminated.forEach(team => ids.add(team.id))
  return ids
})

const getTeamsByDivision = (division: string) => {
  return conferenceStandings.value.filter(team => team.division === division)
}

const isEliminatedInSelectedConference = (teamId: string) => {
  return eliminatedIds.value.has(teamId)
}

const teamButtonClass = (teamId: string) => {
  if (nflStore.selectedTeam === teamId) {
    return 'relative text-left p-3 rounded-md border transition-colors duration-200 border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
  }

  if (isEliminatedInSelectedConference(teamId)) {
    return 'relative text-left p-3 rounded-md border transition-colors duration-200 border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50'
  }

  return 'relative text-left p-3 rounded-md border transition-colors duration-200 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'
}
</script>
