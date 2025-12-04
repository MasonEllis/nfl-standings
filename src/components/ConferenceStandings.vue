<template>
  <div
    :class="[
      'relative overflow-hidden rounded-lg shadow-sm border p-6 transition-colors duration-500',
      nflStore.selectedConference === 'AFC'
        ? 'bg-red-50/80 border-red-200 dark:bg-red-950/20 dark:border-red-800/50'
        : 'bg-blue-50/80 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/50'
    ]"
  >
    <!-- Strong Top Gradient Bar -->
    <div
      :class="[
        'absolute top-0 left-0 right-0 h-1.5 w-full z-10',
        nflStore.selectedConference === 'AFC' ? 'bg-red-500' : 'bg-blue-500'
      ]"
    ></div>

    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 pt-2">
      <div class="flex items-center gap-3">
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
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Standings
          </h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ nflStore.selectedConference }} – {{ mode === 'division' ? 'by Division' : 'Conference Table' }}
          </p>
        </div>
      </div>

      <!-- Mode Toggle -->
      <div class="inline-flex items-center bg-gray-900/90 text-gray-300 rounded-xl p-1 text-xs">
        <button
          type="button"
          class="px-3 py-1 rounded-lg font-medium transition-colors"
          :class="mode === 'division'
            ? 'bg-gray-100 text-gray-900 dark:bg-white dark:text-gray-900 shadow-sm'
            : 'text-gray-300 hover:text-white'"
          @click="mode = 'division'"
        >
          By Division
        </button>
        <button
          type="button"
          class="px-3 py-1 rounded-lg font-medium transition-colors"
          :class="mode === 'conference'
            ? 'bg-gray-100 text-gray-900 dark:bg-white dark:text-gray-900 shadow-sm'
            : 'text-gray-300 hover:text-white'"
          @click="mode = 'conference'"
        >
          Conference
        </button>
      </div>
    </div>

    <!-- Division View -->
    <div v-if="mode === 'division'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="division in divisions" :key="division" class="bg-white/70 dark:bg-gray-900/70 rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div class="px-3 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
            {{ nflStore.selectedConference }} {{ division }}
          </span>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          <button
            v-for="(team, index) in teamsByDivision[division]"
            :key="team.id"
            type="button"
            class="w-full flex items-center justify-between px-3 py-2 text-xs text-left cursor-pointer transition-colors"
            :class="team.id === nflStore.selectedTeam
              ? 'bg-blue-50/80 dark:bg-blue-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'"
            @click="selectTeam(team.id)"
          >
            <div class="flex items-center gap-2">
              <span class="w-5 text-[11px] font-mono text-gray-400">
                {{ index + 1 }}
              </span>
              <img
                :src="nflStore.getTeamLogoUrl(team.id)"
                :alt="team.name"
                class="w-6 h-6 object-contain"
              />
              <div>
                <div class="text-[11px] font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {{ team.city }} {{ team.name }}
                </div>
                <div class="text-[10px] text-gray-500 dark:text-gray-400">
                  {{ team.abbreviation }} • Div {{ team.divisionWins }}-{{ team.divisionLosses }}
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-mono text-[11px] text-gray-900 dark:text-gray-100">
                {{ team.wins }}-{{ team.losses }}{{ team.ties > 0 ? `-${team.ties}` : '' }}
              </div>
              <div class="text-[10px] text-gray-500 dark:text-gray-400">
                {{ (team.winPercentage * 100).toFixed(1) }}%
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Conference View -->
    <div v-else class="mt-1 overflow-x-auto">
      <table class="min-w-full text-xs">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <th class="py-2 pr-2 text-left w-8">#</th>
            <th class="py-2 pr-2 text-left">Team</th>
            <th class="py-2 px-2 text-right">W</th>
            <th class="py-2 px-2 text-right">L</th>
            <th class="py-2 px-2 text-right">T</th>
            <th class="py-2 px-2 text-right">Win %</th>
            <th class="py-2 pl-2 text-right hidden sm:table-cell">Div</th>
            <th class="py-2 pl-2 text-right hidden sm:table-cell">Conf</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(team, index) in conferenceTable"
            :key="team.id"
            :class="[
              'border-b border-gray-100 dark:border-gray-800 cursor-pointer',
              team.id === nflStore.selectedTeam
                ? 'bg-blue-50/80 dark:bg-blue-900/20'
                : index < 7
                  ? 'bg-emerald-50/40 dark:bg-emerald-900/5 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/15'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            ]"
            @click="selectTeam(team.id)"
          >
            <td class="py-1.5 pr-2 text-[11px] font-mono text-gray-500 dark:text-gray-400">
              {{ index + 1 }}
            </td>
            <td class="py-1.5 pr-2">
              <div class="flex items-center gap-2">
                <img
                  :src="nflStore.getTeamLogoUrl(team.id)"
                  :alt="team.name"
                  class="w-5 h-5 object-contain"
                />
                <div>
                  <div class="text-[11px] font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                    {{ team.city }} {{ team.name }}
                  </div>
                  <div class="text-[10px] text-gray-500 dark:text-gray-400">
                    {{ team.abbreviation }} • {{ team.conference }} {{ team.division }}
                  </div>
                </div>
              </div>
            </td>
            <td class="py-1.5 px-2 text-right font-mono text-[11px] text-gray-900 dark:text-gray-100">
              {{ team.wins }}
            </td>
            <td class="py-1.5 px-2 text-right font-mono text-[11px] text-gray-900 dark:text-gray-100">
              {{ team.losses }}
            </td>
            <td class="py-1.5 px-2 text-right font-mono text-[11px] text-gray-900 dark:text-gray-100">
              {{ team.ties }}
            </td>
            <td class="py-1.5 px-2 text-right font-mono text-[11px] text-gray-900 dark:text-gray-100">
              {{ (team.winPercentage * 100).toFixed(1) }}%
            </td>
            <td class="py-1.5 pl-2 text-right font-mono text-[10px] text-gray-500 dark:text-gray-400 hidden sm:table-cell">
              {{ team.divisionWins }}-{{ team.divisionLosses }}
            </td>
            <td class="py-1.5 pl-2 text-right font-mono text-[10px] text-gray-500 dark:text-gray-400 hidden sm:table-cell">
              {{ team.conferenceWins }}-{{ team.conferenceLosses }}
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-2 text-[10px] text-gray-500 dark:text-gray-400">
        Top 7 rows roughly indicate current playoff field for the selected conference.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNFLStore } from '../stores/nfl'
import type { Team } from '../types/nfl'

const nflStore = useNFLStore()

type Mode = 'division' | 'conference'
const mode = ref<Mode>('division')

const divisions = ['East', 'North', 'South', 'West']

const conferenceTeams = computed<Team[]>(() =>
  nflStore.selectedConference === 'AFC' ? nflStore.afcStandings : nflStore.nfcStandings
)

const teamsByDivision = computed<Record<string, Team[]>>(() => {
  const map: Record<string, Team[]> = {
    East: [],
    North: [],
    South: [],
    West: []
  }

  conferenceTeams.value.forEach(team => {
    if (map[team.division]) {
      map[team.division].push(team)
    }
  })

  return map
})

const conferenceTable = computed<Team[]>(() => {
  const list = [...conferenceTeams.value]

  return list.sort((a, b) => {
    if (b.winPercentage !== a.winPercentage) {
      return b.winPercentage - a.winPercentage
    }

    const aDivGames = a.divisionWins + a.divisionLosses
    const bDivGames = b.divisionWins + b.divisionLosses
    const aDivPct = aDivGames > 0 ? a.divisionWins / aDivGames : 0
    const bDivPct = bDivGames > 0 ? b.divisionWins / bDivGames : 0

    if (bDivPct !== aDivPct) {
      return bDivPct - aDivPct
    }

    const aConfGames = a.conferenceWins + a.conferenceLosses
    const bConfGames = b.conferenceWins + b.conferenceLosses
    const aConfPct = aConfGames > 0 ? a.conferenceWins / aConfGames : 0
    const bConfPct = bConfGames > 0 ? b.conferenceWins / bConfGames : 0

    return bConfPct - aConfPct
  })
})

const selectTeam = (teamId: string) => {
  nflStore.setSelectedTeam(teamId)
}
</script>


