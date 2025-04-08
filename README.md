# LBSS Baseball Statistics System

This repository contains the code for the Latvian Baseball and Softball Statistics System. The system is designed to display statistics for players and teams in the Latvian Baseball League.

## Statistics System

The statistics system now uses a JSON file to store and load statistics data. This allows you to easily update the statistics without modifying the code, and ensures that everyone who visits the website sees the same data.

### How to Update Statistics

To update the statistics, you need to edit the `stats.json` file. This file contains all the statistics data in JSON format.

#### File Structure

The `stats.json` file has the following structure:

```json
{
  "battingStats": [
    {
      "playerId": "unique_player_id",
      "name": "Player Name",
      "team": "TEAM_NAME",
      "AB": 10,
      "H": 5,
      "2B": 2,
      "3B": 0,
      "HR": 1,
      "RBI": 3,
      "R": 2,
      "BB": 1,
      "SO": 2,
      "HBP": 0,
      "SF": 0,
      "SAC": 0,
      "SB": 1,
      "CS": 0,
      "AVG": "0.500",
      "OBP": "0.545",
      "SLG": "1.000",
      "OPS": "1.545"
    }
    // Add more player batting stats...
  ],
  "pitchingStats": [
    {
      "playerId": "unique_player_id",
      "name": "Player Name",
      "team": "TEAM_NAME",
      "IP": "6.0",
      "H": 5,
      "R": 2,
      "ER": 1,
      "BB": 3,
      "SO": 8,
      "HR": 0,
      "BF": 25,
      "HBP": 1,
      "WP": 1,
      "BK": 0,
      "W": 1,
      "L": 0,
      "SV": 0,
      "ERA": "1.50",
      "WHIP": "1.33",
      "K/9": "12.00",
      "BB/9": "4.50"
    }
    // Add more player pitching stats...
  ],
  "playerDetails": {
    "unique_player_id": {
      "firstName": "First",
      "lastName": "Last",
      "number": "42",
      "bats": "R",
      "throws": "R",
      "team": "TEAM_NAME"
    }
    // Add more player details...
  },
  "gameStats": {
    "game-1": {
      "homeTeam": "TEAM_A",
      "awayTeam": "TEAM_B",
      "homeScore": 5,
      "awayScore": 3,
      "date": "2024-05-26",
      "time": "11:00",
      "location": "Stadium Name",
      "status": "completed"
    }
    // Add more game details...
  },
  "playerGameStats": {
    "unique_player_id": {
      "batting": {
        "game-1": {
          "AB": 4,
          "H": 2,
          "2B": 1,
          "3B": 0,
          "HR": 0,
          "RBI": 1,
          "R": 1,
          "BB": 1,
          "SO": 1,
          "HBP": 0,
          "SF": 0,
          "SAC": 0,
          "SB": 1,
          "CS": 0
        }
        // Add more game batting stats...
      },
      "pitching": {
        "game-1": {
          "IP": "3.0",
          "H": 3,
          "R": 1,
          "ER": 0,
          "BB": 2,
          "SO": 4,
          "HR": 0,
          "BF": 13,
          "HBP": 0,
          "WP": 1,
          "BK": 0,
          "W": 0,
          "L": 0,
          "SV": 0
        }
        // Add more game pitching stats...
      }
    }
    // Add more player game stats...
  }
}
```

### Adding New Players

To add a new player:

1. Create a unique player ID for the player (e.g., "player123")
2. Add the player's details to the `playerDetails` section
3. Add the player's batting statistics to the `battingStats` section (if applicable)
4. Add the player's pitching statistics to the `pitchingStats` section (if applicable)
5. Add the player's game-by-game statistics to the `playerGameStats` section (if applicable)

### Adding New Games

To add a new game:

1. Create a unique game ID for the game (e.g., "game-123")
2. Add the game details to the `gameStats` section
3. Update the relevant players' game statistics in the `playerGameStats` section

### Deploying to GitHub Pages

To deploy the updated statistics to GitHub Pages:

1. Commit and push the updated `stats.json` file to your GitHub repository
2. Make sure GitHub Pages is enabled for your repository (Settings > Pages)
3. Ensure that your site is being built from the correct branch and directory

Once deployed, all users who visit your GitHub Pages site will see the updated statistics.

## Customization

### Team Names

The system currently recognizes the following team names:
- ARCHERS
- SIGULDA
- PLATONE

If you need to add or change team names, make sure to update the following:
1. The team names in the `stats.json` file
2. The team filter dropdown in the `league-stats.html` file
3. The team logo mappings in the `getTeamLogoUrl` function in the `league-stats.js` file

### Logo Images

Team logos should be placed in the `images/teams/` directory with the following filenames:
- `archers.jpg` for ARCHERS
- `sigulda.jpg` for SIGULDA
- `platone.jpg` for PLATONE
- `default.jpg` as a fallback for unknown teams

## Calculation Formulas

The system automatically calculates several derived statistics:

### Batting Statistics
- **AVG (Batting Average)**: H / AB
- **OBP (On-Base Percentage)**: (H + BB + HBP) / (AB + BB + HBP + SF)
- **SLG (Slugging Percentage)**: (1B + 2*2B + 3*3B + 4*HR) / AB
- **OPS (On-Base Plus Slugging)**: OBP + SLG

### Pitching Statistics
- **ERA (Earned Run Average)**: (9 * ER) / IP
- **WHIP (Walks and Hits per Inning Pitched)**: (BB + H) / IP
- **K/9 (Strikeouts per 9 Innings)**: (9 * SO) / IP
- **BB/9 (Walks per 9 Innings)**: (9 * BB) / IP 