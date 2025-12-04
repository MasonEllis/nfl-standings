export interface Team {
  id: string;
  name: string;
  city: string;
  abbreviation: string;
  conference: 'AFC' | 'NFC';
  division: 'North' | 'South' | 'East' | 'West';
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  divisionWins: number;
  divisionLosses: number;
  conferenceWins: number;
  conferenceLosses: number;
  // Base stats for mid-season start
  baseWins?: number;
  baseLosses?: number;
  baseTies?: number;
  baseDivisionWins?: number;
  baseDivisionLosses?: number;
  baseConferenceWins?: number;
  baseConferenceLosses?: number;
  useBaseStats?: boolean;
}

export interface Game {
  id: string;
  week: number;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  isCompleted: boolean;
  isDivisionGame: boolean;
  isConferenceGame: boolean;
  isSimulated?: boolean;
}

export interface GamePrediction {
  gameId: string;
  predictedWinner: string;
  homeScore: number;
  awayScore: number;
}

export interface PlayoffPicture {
  conference: 'AFC' | 'NFC';
  seeds: {
    seed: number;
    team: Team;
    clinched: boolean;
  }[];
  inTheHunt: Team[];
  eliminated: Team[];
}
