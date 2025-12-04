import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Team, Game, GamePrediction, PlayoffPicture } from '../types/nfl'
import { NFL_TEAMS } from '../data/teams'
import { NFL_SCHEDULE } from '../data/schedule'
import { getCurrentNFLWeek } from '../utils/nflSchedule'

export const useNFLStore = defineStore('nfl', () => {
  const teams = ref<Team[]>([...NFL_TEAMS])
  const schedule = ref<Game[]>([...NFL_SCHEDULE])
  const predictions = ref<GamePrediction[]>([])
  const selectedTeam = ref<string>('DAL')
  const selectedConference = ref<'AFC' | 'NFC'>('NFC')
  const currentWeek = ref(getCurrentNFLWeek())

  // Computed properties
  const afcTeams = computed(() => teams.value.filter(team => team.conference === 'AFC'))
  const nfcTeams = computed(() => teams.value.filter(team => team.conference === 'NFC'))
  
  const selectedTeamData = computed(() => 
    teams.value.find(team => team.id === selectedTeam.value)
  )

  const teamSchedule = computed(() => {
    if (!selectedTeam.value) return []
    return schedule.value
      .filter(game => 
        game.homeTeam === selectedTeam.value || game.awayTeam === selectedTeam.value
      )
      .sort((a, b) => a.week - b.week)
  })

  const afcStandings = computed(() => {
    const afcTeamsCopy = [...afcTeams.value]
    return sortTeamsByStandings(afcTeamsCopy)
  })

  const nfcStandings = computed(() => {
    const nfcTeamsCopy = [...nfcTeams.value]
    return sortTeamsByStandings(nfcTeamsCopy)
  })

  // Functions
  function setSelectedTeam(teamId: string) {
    selectedTeam.value = teamId
    const team = teams.value.find(t => t.id === teamId)
    if (team) {
      selectedConference.value = team.conference
    }
  }

  function setSelectedConference(conference: 'AFC' | 'NFC') {
    selectedConference.value = conference
    
    // Automatically select the #1 seed of the newly selected conference
    // We need to calculate the true seeds first
    const playoffPic = getPlayoffPicture(conference)
    if (playoffPic.seeds.length > 0) {
      selectedTeam.value = playoffPic.seeds[0].team.id
    }
  }

  function getTeamLogoUrl(teamId: string) {
    const team = teams.value.find(t => t.id === teamId)
    if (!team) return ''
    
    let abbr = team.abbreviation.toLowerCase()
    if (abbr === 'wsh') abbr = 'was'
    
    return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr}.png`
  }

  function predictGameOutcome(gameId: string, winnerTeamId: string, homeScore: number, awayScore: number) {
    const existingPredictionIndex = predictions.value.findIndex(p => p.gameId === gameId)
    const prediction: GamePrediction = {
      gameId,
      predictedWinner: winnerTeamId,
      homeScore,
      awayScore
    }

    if (existingPredictionIndex >= 0) {
      predictions.value[existingPredictionIndex] = prediction
    } else {
      predictions.value.push(prediction)
    }

    recalculateStandings()
  }

  function recalculateStandings() {
    // Reset all team records to base values or 0
    teams.value.forEach(team => {
      team.wins = team.baseWins || 0
      team.losses = team.baseLosses || 0
      team.ties = team.baseTies || 0
      team.divisionWins = team.baseDivisionWins || 0
      team.divisionLosses = team.baseDivisionLosses || 0
      team.conferenceWins = team.baseConferenceWins || 0
      team.conferenceLosses = team.baseConferenceLosses || 0
      team.winPercentage = 0
    })

    // Apply completed games and predictions
    schedule.value.forEach(game => {
      let homeScore = game.homeScore
      let awayScore = game.awayScore
      let isCompleted = game.isCompleted

      const prediction = predictions.value.find(p => p.gameId === game.id)
      
      // If the user specifically makes a prediction, we should honor it even if the game was "completed"
      // in the past. This allows "what if" scenarios on past games.
      if (prediction) {
        homeScore = prediction.homeScore
        awayScore = prediction.awayScore
        isCompleted = true
      }

      if (isCompleted && homeScore !== undefined && awayScore !== undefined) {
        const homeTeam = teams.value.find(t => t.id === game.homeTeam)!
        const awayTeam = teams.value.find(t => t.id === game.awayTeam)!

        // Logic to prevent double counting and handle simulated history
        // 1. Future games (>= currentWeek): Always count.
        // 2. Past games (< currentWeek):
        //    - Simulated games: Ignore (they are filler for display only).
        //    - Real games (Week 1, Cowboys history):
        //      - If team uses base stats (e.g. BUF): Ignore (stats already in base).
        //      - If team does NOT use base stats (DAL): Count it.
        
        const shouldApplyToHome = game.week >= currentWeek.value || (!game.isSimulated && !homeTeam.useBaseStats)
        const shouldApplyToAway = game.week >= currentWeek.value || (!game.isSimulated && !awayTeam.useBaseStats)

        if (homeScore > awayScore) {
          if (shouldApplyToHome) {
            homeTeam.wins++
            if (game.isDivisionGame) homeTeam.divisionWins++
            if (game.isConferenceGame) homeTeam.conferenceWins++
          }
          
          if (shouldApplyToAway) {
            awayTeam.losses++
            if (game.isDivisionGame) awayTeam.divisionLosses++
            if (game.isConferenceGame) awayTeam.conferenceLosses++
          }
        } else if (awayScore > homeScore) {
          if (shouldApplyToAway) {
            awayTeam.wins++
            if (game.isDivisionGame) awayTeam.divisionWins++
            if (game.isConferenceGame) awayTeam.conferenceWins++
          }
          
          if (shouldApplyToHome) {
            homeTeam.losses++
            if (game.isDivisionGame) homeTeam.divisionLosses++
            if (game.isConferenceGame) homeTeam.conferenceLosses++
          }
        } else {
          if (shouldApplyToHome) homeTeam.ties++
          if (shouldApplyToAway) awayTeam.ties++
        }
      }
    })

    teams.value.forEach(team => {
      const totalGames = team.wins + team.losses + team.ties
      if (totalGames > 0) {
        team.winPercentage = (team.wins + team.ties * 0.5) / totalGames
      }
    })
  }

  function compareHeadToHead(a: Team, b: Team) {
    let aWins = 0
    let bWins = 0

    for (const game of schedule.value) {
      const involvesA = game.homeTeam === a.id || game.awayTeam === a.id
      const involvesB = game.homeTeam === b.id || game.awayTeam === b.id
      if (!involvesA || !involvesB) continue

      // Determine final scores with predictions applied (mirrors recalculateStandings logic)
      let homeScore = game.homeScore
      let awayScore = game.awayScore
      let isCompleted = game.isCompleted

      const prediction = predictions.value.find(p => p.gameId === game.id)
      if (prediction) {
        homeScore = prediction.homeScore
        awayScore = prediction.awayScore
        isCompleted = true
      }

      if (!isCompleted || homeScore === undefined || awayScore === undefined) continue

      if (homeScore === awayScore) continue

      const winnerId = homeScore > awayScore ? game.homeTeam : game.awayTeam
      if (winnerId === a.id) aWins++
      else if (winnerId === b.id) bWins++
    }

    if (aWins > bWins) return -1
    if (bWins > aWins) return 1
    return 0
  }

  function compareTeamsForStandings(a: Team, b: Team) {
    // 1) Overall win percentage
    if (b.winPercentage !== a.winPercentage) {
      return b.winPercentage - a.winPercentage
    }

    // 2) Head-to-head (only matters once overall records are the same)
    const h2h = compareHeadToHead(a, b)
    if (h2h !== 0) {
      return h2h
    }

    // 3) Division record percentage (only meaningful for teams in same division)
    if (a.division === b.division) {
      const aDivGames = a.divisionWins + a.divisionLosses
      const bDivGames = b.divisionWins + b.divisionLosses
      const aDivPct = aDivGames > 0 ? a.divisionWins / aDivGames : 0
      const bDivPct = bDivGames > 0 ? b.divisionWins / bDivGames : 0
      if (bDivPct !== aDivPct) {
        return bDivPct - aDivPct
      }
    }

    // 4) Conference record percentage
    const aConfGames = a.conferenceWins + a.conferenceLosses
    const bConfGames = b.conferenceWins + b.conferenceLosses
    const aConfPct = aConfGames > 0 ? a.conferenceWins / aConfGames : 0
    const bConfPct = bConfGames > 0 ? b.conferenceWins / bConfGames : 0

    return bConfPct - aConfPct
  }

  function sortTeamsByStandings(teamList: Team[]) {
    const divisions = ['North', 'South', 'East', 'West']
    const sortedTeams: Team[] = []

    divisions.forEach(division => {
      const divisionTeams = teamList
        .filter(team => team.division === division)
        .sort(compareTeamsForStandings)

      sortedTeams.push(...divisionTeams)
    })

    return sortedTeams
  }

  const afcConferenceStandings = computed(() =>
    [...afcTeams.value].sort(compareTeamsForStandings)
  )

  const nfcConferenceStandings = computed(() =>
    [...nfcTeams.value].sort(compareTeamsForStandings)
  )

  function getPlayoffPicture(conference: 'AFC' | 'NFC'): PlayoffPicture {
    const conferenceTeams = conference === 'AFC' ? afcConferenceStandings.value : nfcConferenceStandings.value
    
    const divisions = ['North', 'South', 'East', 'West']
    const divisionWinners = divisions
      .map(division => conferenceTeams.find(team => team.division === division)!)
      .sort(compareTeamsForStandings)

    const wildCardTeams = conferenceTeams
      .filter(team => !divisionWinners.includes(team))
      .sort(compareTeamsForStandings)
      .slice(0, 3)

    const playoffTeams = [...divisionWinners, ...wildCardTeams]
    
    const seeds = playoffTeams.map((team, index) => ({
      seed: index + 1,
      team,
      clinched: false
    }))

    const eliminated = conferenceTeams.filter(team => isTeamEliminated(team.id))

    const inTheHunt = conferenceTeams
      .filter(team => !playoffTeams.includes(team) && !eliminated.includes(team))
      .sort(compareTeamsForStandings)
      .slice(0, 5)

    return {
      conference,
      seeds,
      inTheHunt,
      eliminated
    }
  }

  function isTeamEliminated(teamId: string): boolean {
    const team = teams.value.find(t => t.id === teamId)
    if (!team) return false

    // Simple, standings-based elimination heuristic:
    // Treat the bottom 4 teams in each conference (positions 13–16) as eliminated.
    const conferenceStandingsForTeam = team.conference === 'AFC'
      ? afcConferenceStandings.value
      : nfcConferenceStandings.value

    const idx = conferenceStandingsForTeam.findIndex(t => t.id === teamId)
    if (idx === -1) return false

    return idx >= 12
  }

  function initializeCompletedGames() {
    schedule.value.forEach(game => {
      if (game.week < currentWeek.value && game.homeScore !== undefined && game.awayScore !== undefined) {
        game.isCompleted = true
      }

      if (game.isCompleted && game.homeScore !== undefined && game.awayScore !== undefined) {
        let winner = ''
        if (game.homeScore > game.awayScore) {
          winner = game.homeTeam
        } else if (game.awayScore > game.homeScore) {
          winner = game.awayTeam
        } else {
          winner = 'TIE'
        }
        
        const prediction: GamePrediction = {
          gameId: game.id,
          predictedWinner: winner,
          homeScore: game.homeScore,
          awayScore: game.awayScore
        }
        predictions.value.push(prediction)
      }
    })
    recalculateStandings()
  }

  // Initialize
  // generateMissingHistory() // Disabled as we have full schedule
  initializeCompletedGames()

  // Auto-select #1 seed of default conference (NFC) on load
  const initialPlayoffPic = getPlayoffPicture('NFC')
  if (initialPlayoffPic.seeds.length > 0) {
    selectedTeam.value = initialPlayoffPic.seeds[0].team.id
  } else {
    // Fallback if something is wrong with standings calculation, though shouldn't happen with full schedule
    selectedTeam.value = 'DAL' 
  }

  return {
    teams,
    schedule,
    predictions,
    selectedTeam,
    selectedConference,
    currentWeek,
    afcTeams,
    nfcTeams,
    selectedTeamData,
    teamSchedule,
    afcStandings,
    nfcStandings,
    afcConferenceStandings,
    nfcConferenceStandings,
    setSelectedTeam,
    setSelectedConference,
    getTeamLogoUrl,
    predictGameOutcome,
    recalculateStandings,
    getPlayoffPicture,
    initializeCompletedGames,
    isTeamEliminated
  }
})
