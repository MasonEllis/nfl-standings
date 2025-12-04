import fs from 'fs';

const fetchSchedule = async () => {
  const weeks = [];
  // Weeks 1-18 (Regular Season 2025)
  for (let i = 1; i <= 18; i++) {
    console.log(`Fetching Week ${i}...`);
    try {
      const response = await fetch(`https://cdn.espn.com/core/nfl/schedule?xhr=1&year=2025&week=${i}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // The structure is likely data.content.schedule...
      // But let's look at what we get. The CDN endpoint returns a complex object.
      // Usually data.content.schedule is a map of dates to games.
      
      // For now, let's just save the raw response for the first week to inspect it if I were debugging,
      // but here I need to parse it blindly or guess.
      // However, standard ESPN hidden API structure usually has 'schedule' key.
      
      const scheduleData = data.content.schedule;
      if (!scheduleData) {
          console.error('No schedule data found in response');
          continue;
      }

      // scheduleData is an object where keys are dates, values are objects with 'games' array
      Object.values(scheduleData).forEach(day => {
        if (day.games) {
           day.games.forEach(game => {
               const competition = game.competitions[0];
               const homeComp = competition.competitors.find(c => c.homeAway === 'home');
               const awayComp = competition.competitors.find(c => c.homeAway === 'away');
               
               weeks.push({
                  id: game.id,
                  week: i,
                  date: game.date,
                  shortName: game.shortName,
                  homeTeam: {
                    id: homeComp.team.abbreviation,
                    score: parseInt(homeComp.score || '0')
                  },
                  awayTeam: {
                    id: awayComp.team.abbreviation,
                    score: parseInt(awayComp.score || '0')
                  },
                  completed: game.status.type.completed
               });
           });
        }
      });

    } catch (err) {
      console.error(`Error fetching week ${i}:`, err.message);
    }
    // Small delay
    await new Promise(r => setTimeout(r, 200));
  }
  
  fs.writeFileSync('nfl_schedule_2025.json', JSON.stringify(weeks, null, 2));
  console.log('Done! Saved to nfl_schedule_2025.json');
};

fetchSchedule();
