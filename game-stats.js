// Game Statistics Management

// Constants for stat types
const BATTING_STATS = ['AB', 'H', '2B', '3B', 'HR', 'RBI', 'R', 'BB', 'SO', 'HBP', 'SF', 'SAC', 'SB', 'CS'];
const PITCHING_STATS = ['IP', 'H', 'R', 'ER', 'BB', 'SO', 'HR', 'BF', 'HBP', 'WP', 'BK', 'W', 'L', 'SV'];

// Create empty stat object
function createEmptyStats(type) {
    const stats = {};
    const statsList = type === 'batting' ? BATTING_STATS : PITCHING_STATS;
    statsList.forEach(stat => stats[stat] = 0);
    return stats;
}

// Save game stats
function saveGameStats(gameId, stats) {
    localStorage.setItem(`game_stats_${gameId}`, JSON.stringify(stats));
}

// Load game stats
function loadGameStats(gameId) {
    return JSON.parse(localStorage.getItem(`game_stats_${gameId}`) || '{}');
}

// Add stats for a player in a game
function addPlayerGameStats(gameId, playerId, teamId, type, stats) {
    const gameStats = loadGameStats(gameId) || {};
    if (!gameStats[teamId]) gameStats[teamId] = { batting: {}, pitching: {} };
    if (!gameStats[teamId][type][playerId]) {
        gameStats[teamId][type][playerId] = createEmptyStats(type);
    }
    
    // Update stats
    const playerStats = gameStats[teamId][type][playerId];
    const statsList = type === 'batting' ? BATTING_STATS : PITCHING_STATS;
    
    statsList.forEach(stat => {
        if (stats[stat] !== undefined) {
            playerStats[stat] = Number(stats[stat]);
        }
    });
    
    saveGameStats(gameId, gameStats);
}

// Get player's total stats across all games
function getPlayerTotalStats(playerId, teamId, type) {
    const totalStats = createEmptyStats(type);
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    
    games.forEach(game => {
        if (!game.isCompleted) return;
        
        const gameStats = loadGameStats(game.id);
        if (!gameStats || !gameStats[teamId] || !gameStats[teamId][type] || !gameStats[teamId][type][playerId]) return;
        
        const playerGameStats = gameStats[teamId][type][playerId];
        const statsList = type === 'batting' ? BATTING_STATS : PITCHING_STATS;
        
        statsList.forEach(stat => {
            totalStats[stat] += Number(playerGameStats[stat] || 0);
        });
    });
    
    return totalStats;
}

// Create stat input row for a player
function createStatInputRow(type) {
    const div = document.createElement('div');
    div.className = 'stat-inputs';
    
    const statsList = type === 'batting' ? BATTING_STATS : PITCHING_STATS;
    const html = statsList.map(stat => `
        <div class="stat-input">
            <label>${stat}</label>
            <input type="number" name="${stat}" min="0" step="${stat === 'IP' ? '0.1' : '1'}" value="0">
        </div>
    `).join('');
    
    div.innerHTML = html;
    return div;
}

// Format stat value for display
function formatStatValue(stat, value) {
    if (stat === 'IP') {
        return value.toFixed(1);
    }
    return value.toString();
}

// Display game stats in modal
function displayGameStats(gameId, homeTeam, awayTeam) {
    const stats = loadGameStats(gameId);
    const modal = document.getElementById('game-stats-modal');
    const content = modal.querySelector('.game-stats-content');
    
    content.innerHTML = '';
    
    [homeTeam, awayTeam].forEach(team => {
        const teamStats = stats[team] || { batting: {}, pitching: {} };
        
        const teamSection = document.createElement('div');
        teamSection.className = 'team-stats';
        teamSection.innerHTML = `
            <h3>${team}</h3>
            <div class="stats-tables">
                <div class="batting-stats">
                    <h4>Batting</h4>
                    ${createStatsTable('batting', teamStats.batting)}
                </div>
                <div class="pitching-stats">
                    <h4>Pitching</h4>
                    ${createStatsTable('pitching', teamStats.pitching)}
                </div>
            </div>
        `;
        
        content.appendChild(teamSection);
    });
}

// Create stats table HTML
function createStatsTable(type, stats) {
    const statsList = type === 'batting' ? BATTING_STATS : PITCHING_STATS;
    const players = Object.keys(stats);
    
    if (players.length === 0) {
        return '<p>Nav statistikas</p>';
    }
    
    return `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>Spēlētājs</th>
                    ${statsList.map(stat => `<th>${stat}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${players.map(playerId => {
                    const player = getPlayerInfo(playerId);
                    const playerStats = stats[playerId];
                    return `
                        <tr>
                            <td>${player ? `${player.firstName} ${player.lastName}` : 'Unknown Player'}</td>
                            ${statsList.map(stat => `
                                <td>${formatStatValue(stat, playerStats[stat] || 0)}</td>
                            `).join('')}
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// Get player info from localStorage
function getPlayerInfo(playerId) {
    const teams = ['ARCHERS', 'SIGULDA', 'PLATONE'];
    for (const team of teams) {
        const players = JSON.parse(localStorage.getItem(`players_${team}`) || '[]');
        const player = players.find(p => p.id === playerId);
        if (player) return player;
    }
    return null;
}

// Game Statistics Functionality
let currentGame = null;
let currentTeam = null;

function openGameStatsModal(gameId) {
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    const game = games.find(g => g.id === gameId);
    if (!game) {
        console.error('Game not found:', gameId);
        return;
    }

    currentGame = game;
    currentTeam = game.homeTeam;

    const modal = document.getElementById('game-stats-modal');
    if (!modal) {
        console.error('Game stats modal not found');
        return;
    }

    const gameInfo = modal.querySelector('.game-info');
    if (gameInfo) {
        gameInfo.innerHTML = `
            <p><i class="fas fa-baseball-ball"></i> ${game.homeTeam} vs ${game.awayTeam}</p>
            <p><i class="fas fa-calendar"></i> ${game.date}, ${game.time}</p>
            <p><i class="fas fa-trophy"></i> ${game.homeScore} - ${game.awayScore}</p>
        `;
    }

    // Update team buttons
    const teamBtns = modal.querySelectorAll('.team-btn');
    teamBtns[0].textContent = game.homeTeam;
    teamBtns[1].textContent = game.awayTeam;
    teamBtns[0].classList.add('active');
    teamBtns[1].classList.remove('active');

    // Clear existing rows
    modal.querySelectorAll('.stats-table tbody').forEach(tbody => {
        tbody.innerHTML = '';
    });

    // Load existing stats from localStorage
    const existingStats = JSON.parse(localStorage.getItem(`stats_${gameId}`) || '{}');
    
    // If there are existing stats, load them
    if (existingStats[currentTeam]) {
        loadExistingStats(currentTeam);
    } else {
        // Add initial empty rows if no stats exist
        addBattingRow();
        addPitchingRow();
    }

    // Show modal
    modal.style.display = 'block';
    modal.classList.add('show');

    // Update player selects
    updatePlayerSelects();
}

function closeGameStats() {
    const modal = document.getElementById('game-stats-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        currentGame = null;
        currentTeam = null;
    }
}

function updatePlayerSelects() {
    const players = JSON.parse(localStorage.getItem(`players_${currentTeam}`) || '[]');
    const selects = document.querySelectorAll('.player-select');
    
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Izvēlēties spēlētāju</option>';
        players.sort((a, b) => a.number - b.number).forEach(player => {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = `#${player.number} ${player.firstName} ${player.lastName}`;
            if (player.id === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    });
}

function loadTeamPlayers(teamId) {
    const players = JSON.parse(localStorage.getItem(`players_${teamId}`) || '[]');
    const selects = document.querySelectorAll(`.stats-section[data-team="${teamId}"] .player-select`);
    
    selects.forEach(select => {
        select.innerHTML = '<option value="">Izvēlēties spēlētāju</option>';
        players.sort((a, b) => a.number - b.number).forEach(player => {
            select.innerHTML += `
                <option value="${player.id}">#${player.number} ${player.firstName} ${player.lastName}</option>
            `;
        });
    });
}

function loadExistingStats(teamId) {
    if (!currentGame) return;

    // Clear existing rows first
    document.querySelectorAll('.stats-table tbody').forEach(tbody => {
        tbody.innerHTML = '';
    });

    // Get stats from localStorage
    const stats = JSON.parse(localStorage.getItem(`stats_${currentGame.id}`) || '{}');
    const teamStats = stats[teamId] || {};

    // Load batting stats
    if (Object.keys(teamStats.batting || {}).length > 0) {
        Object.entries(teamStats.batting).forEach(([playerId, playerStats]) => {
            addBattingRow(playerId, playerStats);
        });
    } else {
        // Add one empty row if no stats exist
        addBattingRow();
    }

    // Load pitching stats
    if (Object.keys(teamStats.pitching || {}).length > 0) {
        Object.entries(teamStats.pitching).forEach(([playerId, playerStats]) => {
            addPitchingRow(playerId, playerStats);
        });
    } else {
        // Add one empty row if no stats exist
        addPitchingRow();
    }
}

function switchTeam(btn) {
    // Save current team's stats before switching
    saveGameStats();

    // Switch teams
    const teamBtns = document.querySelectorAll('.team-btn');
    teamBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTeam = btn.textContent;
    
    // Load stats for the new team
    loadExistingStats(currentTeam);
    
    // Update player selects
    updatePlayerSelects();
}

function addBattingRow(playerId = null, existingStats = null) {
    const tbody = document.querySelector('.batting-table tbody');
    if (!tbody) {
        console.error('Batting stats table not found');
        return;
    }

    const row = document.createElement('tr');
    row.className = 'player-row';
    if (playerId) row.dataset.playerId = playerId;

    row.innerHTML = `
        <td>
            <select class="player-select" onchange="updatePlayerId(this)">
                <option value="">Izvēlēties spēlētāju</option>
                ${getPlayerOptions(currentTeam, playerId)}
            </select>
        </td>
        <td><input type="number" min="0" value="${existingStats?.AB || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.H || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.['2B'] || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.['3B'] || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.HR || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.RBI || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.R || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.BB || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.SO || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.HBP || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.SF || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.SAC || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.SB || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.CS || 0}"></td>
        <td>
            <button class="remove-btn" onclick="removeRow(this)">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;

    tbody.appendChild(row);
}

function addPitchingRow(playerId = null, existingStats = null) {
    const tbody = document.querySelector('.pitching-table tbody');
    if (!tbody) {
        console.error('Pitching stats table not found');
        return;
    }

    const row = document.createElement('tr');
    row.className = 'player-row';
    if (playerId) row.dataset.playerId = playerId;

    row.innerHTML = `
        <td>
            <select class="player-select" onchange="updatePlayerId(this)">
                <option value="">Izvēlēties spēlētāju</option>
                ${getPlayerOptions(currentTeam, playerId)}
            </select>
        </td>
        <td><input type="number" min="0" step="0.1" value="${existingStats?.IP || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.H || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.R || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.ER || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.BB || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.SO || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.HR || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.BF || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.HBP || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.WP || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.BK || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.W || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.L || 0}"></td>
        <td><input type="number" min="0" value="${existingStats?.SV || 0}"></td>
        <td>
            <button class="remove-btn" onclick="removeRow(this)">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;

    tbody.appendChild(row);
}

function getPlayerOptions(teamId, selectedPlayerId = null) {
    const players = JSON.parse(localStorage.getItem(`players_${teamId}`) || '[]');
    return players
        .sort((a, b) => a.number - b.number)
        .map(player => `
            <option value="${player.id}" ${player.id === selectedPlayerId ? 'selected' : ''}>
                #${player.number} ${player.firstName} ${player.lastName}
            </option>
        `)
        .join('');
}

function updatePlayerId(select) {
    const row = select.closest('tr');
    if (row) {
        row.dataset.playerId = select.value;
    }
}

function removeRow(button) {
    const row = button.closest('tr');
    if (row) {
        row.remove();
    }
}

function saveGameStats() {
    if (!currentGame) {
        console.error('No game selected');
        return;
    }

    try {
        // Get all existing stats first
        const allStats = JSON.parse(localStorage.getItem(`stats_${currentGame.id}`) || '{}');

        // Save current team's stats
        const currentTeamStats = {
            batting: {},
            pitching: {}
        };

        // Get batting stats
        document.querySelectorAll('.batting-table tbody tr').forEach(row => {
            const playerId = row.dataset.playerId;
            if (!playerId) return;

            const playerStats = {};
            const inputs = row.querySelectorAll('input[type="number"]');
            BATTING_STATS.forEach((stat, index) => {
                playerStats[stat] = parseFloat(inputs[index].value) || 0;
            });

            currentTeamStats.batting[playerId] = playerStats;
        });

        // Get pitching stats
        document.querySelectorAll('.pitching-table tbody tr').forEach(row => {
            const playerId = row.dataset.playerId;
            if (!playerId) return;

            const playerStats = {};
            const inputs = row.querySelectorAll('input[type="number"]');
            PITCHING_STATS.forEach((stat, index) => {
                playerStats[stat] = parseFloat(inputs[index].value) || 0;
            });

            currentTeamStats.pitching[playerId] = playerStats;
        });

        // Update current team's stats while preserving other team's stats
        allStats[currentTeam] = currentTeamStats;

        // Save all stats back to localStorage
        localStorage.setItem(`stats_${currentGame.id}`, JSON.stringify(allStats));
        alert('Statistika veiksmīgi saglabāta!');

        // Don't close the modal after saving
        // closeGameStats();
    } catch (error) {
        console.error('Error saving stats:', error);
        alert('Kļūda saglabājot statistiku. Lūdzu, mēģiniet vēlreiz.');
    }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // Close button functionality
    const closeBtn = document.querySelector('#game-stats-modal .close');
    if (closeBtn) {
        closeBtn.onclick = closeGameStats;
    }

    // Close on outside click
    window.onclick = function(event) {
        const modal = document.getElementById('game-stats-modal');
        if (event.target === modal) {
            closeGameStats();
        }
    };

    // Team switching
    document.querySelectorAll('.team-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTeam(btn));
    });

    // Add click handlers for "Add Player" buttons
    const battingBtn = document.querySelector('.batting-section .add-player-btn');
    if (battingBtn) {
        battingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addBattingRow();
        });
    }

    const pitchingBtn = document.querySelector('.pitching-section .add-player-btn');
    if (pitchingBtn) {
        pitchingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addPitchingRow();
        });
    }
}); 