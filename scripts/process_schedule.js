import fs from 'fs';

// Team data for division/conference lookup
const teams = [
  { id: 'NE', conference: 'AFC', division: 'East' },
  { id: 'BUF', conference: 'AFC', division: 'East' },
  { id: 'MIA', conference: 'AFC', division: 'East' },
  { id: 'NYJ', conference: 'AFC', division: 'East' },
  { id: 'BAL', conference: 'AFC', division: 'North' },
  { id: 'PIT', conference: 'AFC', division: 'North' },
  { id: 'CIN', conference: 'AFC', division: 'North' },
  { id: 'CLE', conference: 'AFC', division: 'North' },
  { id: 'JAX', conference: 'AFC', division: 'South' },
  { id: 'IND', conference: 'AFC', division: 'South' },
  { id: 'HOU', conference: 'AFC', division: 'South' },
  { id: 'TEN', conference: 'AFC', division: 'South' },
  { id: 'KC', conference: 'AFC', division: 'West' },
  { id: 'DEN', conference: 'AFC', division: 'West' },
  { id: 'LAC', conference: 'AFC', division: 'West' },
  { id: 'LV', conference: 'AFC', division: 'West' },
  { id: 'PHI', conference: 'NFC', division: 'East' },
  { id: 'DAL', conference: 'NFC', division: 'East' },
  { id: 'WSH', conference: 'NFC', division: 'East' },
  { id: 'NYG', conference: 'NFC', division: 'East' },
  { id: 'DET', conference: 'NFC', division: 'North' },
  { id: 'MIN', conference: 'NFC', division: 'North' },
  { id: 'GB', conference: 'NFC', division: 'North' },
  { id: 'CHI', conference: 'NFC', division: 'North' },
  { id: 'TB', conference: 'NFC', division: 'South' },
  { id: 'ATL', conference: 'NFC', division: 'South' },
  { id: 'CAR', conference: 'NFC', division: 'South' },
  { id: 'NO', conference: 'NFC', division: 'South' },
  { id: 'LAR', conference: 'NFC', division: 'West' },
  { id: 'SEA', conference: 'NFC', division: 'West' },
  { id: 'SF', conference: 'NFC', division: 'West' },
  { id: 'ARI', conference: 'NFC', division: 'West' }
];

const getTeam = (id) => teams.find(t => t.id === id);

const rawSchedule = JSON.parse(fs.readFileSync('nfl_schedule_2025.json', 'utf8'));

const processedSchedule = rawSchedule.map(game => {
    const home = getTeam(game.homeTeam.id);
    const away = getTeam(game.awayTeam.id);

    if (!home || !away) {
        console.warn(`Unknown team in game ${game.id}: ${game.homeTeam.id} vs ${game.awayTeam.id}`);
        return {
            ...game,
            isDivisionGame: false,
            isConferenceGame: false
        };
    }

    const isConferenceGame = home.conference === away.conference;
    const isDivisionGame = isConferenceGame && home.division === away.division;

    return {
        id: game.id,
        week: game.week,
        homeTeam: game.homeTeam.id,
        awayTeam: game.awayTeam.id,
        homeScore: game.homeTeam.score,
        awayScore: game.awayTeam.score,
        isCompleted: game.completed,
        isDivisionGame,
        isConferenceGame
    };
});

const fileContent = `import type { Game } from '../types/nfl'

export const NFL_SCHEDULE: Game[] = ${JSON.stringify(processedSchedule, null, 2)}
`;

fs.writeFileSync('src/data/schedule.ts', fileContent);
console.log('Updated src/data/schedule.ts');

