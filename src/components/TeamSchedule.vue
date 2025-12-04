<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-4 transition-colors duration-300">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
      {{ nflStore.selectedTeamData?.city }} {{ nflStore.selectedTeamData?.name }} Schedule
    </h2>
    
    <div class="flex flex-wrap gap-3">
      <div
        v-for="game in nflStore.teamSchedule"
        :key="game.id"
        :class="[
          'flex-shrink-0 w-40 border rounded-lg p-3 transition-colors flex flex-col justify-between',
          getGameResultClass(game)
        ]"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Week {{ game.week }}</span>
          <span v-if="game.isDivisionGame" class="text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-1.5 py-0.5 rounded-full" title="Division Game">
            DIV
          </span>
        </div>
        
        <div class="flex flex-col items-center justify-center mb-3 space-y-2">
          <div class="flex flex-col items-center">
             <span class="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
              {{ game.homeTeam === nflStore.selectedTeam ? 'vs' : '@' }}
            </span>
            <img 
              :src="nflStore.getTeamLogoUrl(game.homeTeam === nflStore.selectedTeam ? game.awayTeam : game.homeTeam)" 
              :alt="getTeamName(game.homeTeam === nflStore.selectedTeam ? game.awayTeam : game.homeTeam)"
              class="w-10 h-10 object-contain mb-1"
            />
            <span class="text-sm font-bold text-center leading-tight text-gray-900 dark:text-gray-100 line-clamp-1">
              {{ getTeamAbbr(game.homeTeam === nflStore.selectedTeam ? game.awayTeam : game.homeTeam) }}
            </span>
          </div>
        </div>

        <div class="space-y-2">
          <!-- Outcome Selection -->
          <div class="flex items-center justify-center space-x-1">
            <button 
              @click="setOutcome(game, 'W')"
              :class="['flex-1 h-8 text-sm font-bold rounded border transition-colors', isOutcomeSelected(game, 'W') ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700']"
              title="Win"
            >W</button>
            <button 
              @click="setOutcome(game, 'L')"
              :class="['flex-1 h-8 text-sm font-bold rounded border transition-colors', isOutcomeSelected(game, 'L') ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700']"
              title="Loss"
            >L</button>
            <button 
              @click="setOutcome(game, 'T')"
              :class="['w-8 h-8 text-sm font-bold rounded border transition-colors', isOutcomeSelected(game, 'T') ? 'bg-gray-500 text-white border-gray-500 shadow-sm' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-700']"
              title="Tie"
            >T</button>
          </div>
          
           <!-- Show original score for completed games -->
          <div v-if="game.isCompleted" class="text-[10px] text-center text-gray-400 dark:text-gray-500">
             Orig: {{ game.awayScore }}-{{ game.homeScore }}
          </div>
          <div v-else class="h-[15px]"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useNFLStore } from '../stores/nfl'
import type { Game } from '../types/nfl'

const nflStore = useNFLStore()

// Local prediction inputs
const predictions = ref<Record<string, { winner: string }>>({})

const getTeamName = (teamId: string) => {
  const team = nflStore.teams.find(t => t.id === teamId)
  return team ? `${team.city} ${team.name}` : teamId
}

const getTeamAbbr = (teamId: string) => {
  const team = nflStore.teams.find(t => t.id === teamId)
  return team ? team.abbreviation : teamId
}

const getGameResultClass = (game: Game) => {
  const pred = predictions.value[game.id]
  if (!pred || !pred.winner) return 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border-gray-200 dark:border-gray-700'

  if (pred.winner === 'TIE') return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
  
  if (pred.winner === nflStore.selectedTeam) {
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  } else {
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }
}

const isOutcomeSelected = (game: Game, outcome: 'W' | 'L' | 'T') => {
  const pred = predictions.value[game.id]
  if (!pred || !pred.winner) return false

  if (outcome === 'T') return pred.winner === 'TIE'
  
  if (outcome === 'W') {
    return pred.winner === nflStore.selectedTeam
  }
  
  if (outcome === 'L') {
    return pred.winner !== nflStore.selectedTeam && pred.winner !== 'TIE'
  }
  
  return false
}

const setOutcome = (game: Game, outcome: 'W' | 'L' | 'T') => {
  let winner = ''
  if (outcome === 'T') {
    winner = 'TIE'
  } else if (outcome === 'W') {
    winner = nflStore.selectedTeam
  } else {
    // Loss - winner is the opponent
    winner = game.homeTeam === nflStore.selectedTeam ? game.awayTeam : game.homeTeam
  }
  
  predictions.value[game.id] = { winner }
  
  // Predict score logic
  let homeScore = 0
  let awayScore = 0
  
  if (winner === 'TIE') {
    homeScore = 14
    awayScore = 14
  } else if (winner === game.homeTeam) {
    homeScore = 21
    awayScore = 14
  } else {
    homeScore = 14
    awayScore = 21
  }

  nflStore.predictGameOutcome(game.id, winner, homeScore, awayScore)
}

// Initialize prediction inputs for each game
const initializePredictions = () => {
  nflStore.teamSchedule.forEach(game => {
    // We always want to respect the store's predictions first (which includes completed games)
    const storePrediction = nflStore.predictions.find(p => p.gameId === game.id)
    
    if (storePrediction) {
      predictions.value[game.id] = { winner: storePrediction.predictedWinner }
    } else if (game.isCompleted && game.homeScore !== undefined && game.awayScore !== undefined) {
      // Fallback for completed games not in predictions (shouldn't happen with current store logic but safe to keep)
      let winner = ''
      if (game.homeScore > game.awayScore) {
        winner = game.homeTeam
      } else if (game.awayScore > game.homeScore) {
        winner = game.awayTeam
      } else {
        winner = 'TIE'
      }
      predictions.value[game.id] = { winner }
    }
  })
}

// Initialize on component mount and when team changes
initializePredictions()

// Watch for team changes and reinitialize
watch(() => nflStore.selectedTeam, () => {
  predictions.value = {} // Clear local state
  initializePredictions()
}, { immediate: true })

// Watch for store prediction changes (e.g. if updated from another view)
watch(() => nflStore.predictions, () => {
  initializePredictions()
}, { deep: true })
</script>
