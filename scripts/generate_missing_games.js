const fs = require('fs');

const teams = [
  'NE', 'BUF', 'MIA', 'NYJ',
  'BAL', 'PIT', 'CIN', 'CLE',
  'JAX', 'IND', 'HOU', 'TEN',
  'KC', 'DEN', 'LAC', 'LV',
  'PHI', 'DAL', 'WSH', 'NYG',
  'DET', 'MIN', 'GB', 'CHI',
  'TB', 'ATL', 'CAR', 'NO',
  'LAR', 'SEA', 'SF', 'ARI'
];

const cowboysGames = [
  { week: 2, opponent: 'NYG' },
  { week: 3, opponent: 'CHI' },
  { week: 4, opponent: 'GB' },
  { week: 5, opponent: 'NYJ' },
  { week: 6, opponent: 'CAR' },
  { week: 7, opponent: 'WSH' },
  { week: 8, opponent: 'DEN' },
  { week: 9, opponent: 'ARI' },
  // Week 10 Bye
  { week: 11, opponent: 'LV' },
  { week: 12, opponent: 'PHI' },
  { week: 13, opponent: 'KC' }
];

const games = [];

for (let week = 2; week <= 13; week++) {
  const playingTeams = new Set();
  
  // Add Cowboys game teams
  const dalGame = cowboysGames.find(g => g.week === week);
  if (dalGame) {
    playingTeams.add('DAL');
    playingTeams.add(dalGame.opponent);
  } else {
    // Cowboys Bye Week 10
    // Do nothing, they are not playing
  }

  // Identify available teams
  let availableTeams = teams.filter(t => !playingTeams.has(t));
  
  // Handle Byes (rough approximation - 2 to 4 teams per week usually)
  // We will just pair up everyone else to ensure "Full Schedule" feel.
  // If we have odd number, one sits out (Bye).
  
  // Shuffle available teams
  availableTeams.sort(() => Math.random() - 0.5);
  
  // Pair them
  while (availableTeams.length >= 2) {
    const home = availableTeams.pop();
    const away = availableTeams.pop();
    
    // Generate random score
    const homeScore = Math.floor(Math.random() * 30) + 10;
    const awayScore = Math.floor(Math.random() * 30) + 10;
    
    games.push({
      id: `w${week}-sim-${home}-${away}`,
      week: week,
      homeTeam: home,
      awayTeam: away,
      homeScore: homeScore,
      awayScore: awayScore,
      isCompleted: true,
      isDivisionGame: false, // Simplification
      isConferenceGame: false, // Simplification
      isSimulated: true
    });
  }
}

console.log(JSON.stringify(games, null, 2));





