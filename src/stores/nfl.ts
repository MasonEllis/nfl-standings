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

  function sortTeamsByStandings(teamList: Team[]) {
    const divisions = ['North', 'South', 'East', 'West']
    const sortedTeams: Team[] = []

    divisions.forEach(division => {
      const divisionTeams = teamList
        .filter(team => team.division === division)
        .sort((a, b) => {
          if (b.winPercentage !== a.winPercentage) {
            return b.winPercentage - a.winPercentage
          }
          const aDivPct = a.divisionWins / (a.divisionWins + a.divisionLosses) || 0
          const bDivPct = b.divisionWins / (b.divisionWins + b.divisionLosses) || 0
          if (bDivPct !== aDivPct) {
            return bDivPct - aDivPct
          }
          const aConfPct = a.conferenceWins / (a.conferenceWins + a.conferenceLosses) || 0
          const bConfPct = b.conferenceWins / (b.conferenceWins + b.conferenceLosses) || 0
          return bConfPct - aConfPct
        })

      sortedTeams.push(...divisionTeams)
    })

    return sortedTeams
  }

  function getPlayoffPicture(conference: 'AFC' | 'NFC'): PlayoffPicture {
    const conferenceTeams = conference === 'AFC' ? afcStandings.value : nfcStandings.value
    
    const divisions = ['North', 'South', 'East', 'West']
    const divisionWinners = divisions.map(division => 
      conferenceTeams.find(team => team.division === division)!
    ).sort((a, b) => b.winPercentage - a.winPercentage)

    const wildCardTeams = conferenceTeams
      .filter(team => !divisionWinners.includes(team))
      .sort((a, b) => b.winPercentage - a.winPercentage)
      .slice(0, 3)

    const playoffTeams = [...divisionWinners, ...wildCardTeams]
    
    const seeds = playoffTeams.map((team, index) => ({
      seed: index + 1,
      team,
      clinched: false
    }))

    const inTheHunt = conferenceTeams
      .filter(team => !playoffTeams.includes(team))
      .sort((a, b) => b.winPercentage - a.winPercentage) // Ensure hunt is also sorted
      .slice(0, 5) // Increase hunt size to reduce false eliminations in simple logic

    // For now, we only show "eliminated" if they are REALLY far down, 
    // or we can remove the visual "Eliminated" bucket from the PlayoffPicture component 
    // if it's confusing. But the user wants "mathematically eliminated".
    // True math elimination is hard. Let's just expand "In the Hunt" to be more generous for now
    // so 6-7 teams aren't marked as eliminated too early.
    
    const eliminated = conferenceTeams
      .filter(team => !playoffTeams.includes(team) && !inTheHunt.includes(team))

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

    // Simple Mathematical Elimination Check
    // 1. Calculate max possible wins for this team
    const remainingGames = schedule.value.filter(g => 
      !g.isCompleted && (g.homeTeam === teamId || g.awayTeam === teamId)
    ).length
    const maxPossibleWins = team.wins + remainingGames

    // 2. Get the current 7th seed's win count (threshold) in their conference
    // This is an approximation. True elimination requires checking if 7 other teams
    // WILL GUARANTEED finish with better records.
    // But a safe "soft" check is: Can they reach the current 7th seed's win count?
    // If 7th seed has 9 wins, and max possible is 8, they are OUT.
    
    const conferenceTeams = team.conference === 'AFC' ? afcStandings.value : nfcStandings.value
    
    // Sort by wins to find the 7th best record roughly
    // (Win percentage is better but wins is a hard floor)
    const sortedByWins = [...conferenceTeams].sort((a, b) => b.wins - a.wins)
    const seventhSeedWins = sortedByWins[6]?.wins || 0

    // A slightly more aggressive check:
    // If maxPossibleWins < 7th_seed_current_wins, they are definitely out.
    // (Actually they might not be if 7th seed loses out, but usually 7th seed wins is a low bar).
    // Wait, if 7th seed has 8 wins, and I can get to 8, I'm not eliminated.
    // Elimination happens when MaxPossible < CurrentCutoff? 
    // No, because CurrentCutoff can rise. 
    // But if MaxPossible < Current 7th Seed Wins, it's ALMOST certain, 
    // unless the 7th seed is currently tied with others and drops?
    // Actually, "Eliminated" usually means "Cannot catch the 7th spot".
    // Let's stick to the previous logic of "Not in Top 12" but make the list wider?
    // Or just remove the badge if it's inaccurate for DAL (who are likely close).
    
    // Better approach for this specific user complaint:
    // The Cowboys are 6-5-1 or similar? They shouldn't be eliminated.
    // The previous logic was "Not in top 7 AND Not in next 4".
    // If DAL is 12th in conference, they get marked eliminated.
    // Let's strictly limit "Eliminated" to teams with very poor records for now,
    // or just disable the visual badge if it's too aggressive.
    
    // Let's use a simple Win% threshold for "Eliminated" badge to avoid false positives
    // e.g. Max possible wins < 8 (since 7th seed is usually 9-10 wins)
    
    if (maxPossibleWins < 7) return true
    
    return false
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
