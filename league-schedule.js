// Game data structure
const games = {
    'game-1': {
        id: 'game-1',
        stage: 'I. POSMS',
        date: '26. maijs',
        time: '11:00',
        location: 'Rīga, LU beisbola laukums',
        homeTeam: 'ARCHERS',
        awayTeam: 'SIGULDA',
        homeScore: 13,
        awayScore: 16
    },
    'game-2': {
        id: 'game-2',
        stage: 'I. POSMS',
        date: '26. maijs',
        time: '13:00',
        location: 'Rīga, LU beisbola laukums',
        homeTeam: 'SIGULDA',
        awayTeam: 'PLATONE',
        homeScore: 6,
        awayScore: 7
    },
    'game-3': {
        id: 'game-3',
        stage: 'I. POSMS',
        date: '26. maijs',
        time: '15:00',
        location: 'Rīga, LU beisbola laukums',
        homeTeam: 'PLATONE',
        awayTeam: 'ARCHERS',
        homeScore: 2,
        awayScore: 15
    }
};
// All game data now loaded from stats.json

// Initialize the schedule
document.addEventListener('DOMContentLoaded', () => {
    // Any initialization code can go here
    loadDataFromJson();
});

// Function to export local storage data to a file
function exportLocalStorageToFile() {
    if (!isAdmin) {
        console.error('Only admins can export data');
        return;
    }

    // Collect all local storage data
    const exportData = {};
    
    // Get all keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
            exportData[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
            exportData[key] = localStorage.getItem(key);
        }
    }

    // Create a blob with the data
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stats.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to load all data from stats.json
function loadDataFromJson() {
    console.log('Loading data from stats.json');
    
    // For GitHub Pages, we need to use the correct path
    const isGitHubPages = window.location.hostname.includes('github.io');
    const isSubfolder = window.location.pathname.split('/').length > 2;
    
    // Determine the correct path for stats.json
    let statsJsonPath = 'stats.json';
    if (isGitHubPages) {
        // For GitHub Pages, we need to use the repository name in the path
        const repoName = window.location.pathname.split('/')[1];
        statsJsonPath = `/${repoName}/stats.json`;
    } else if (isSubfolder) {
        statsJsonPath = '../stats.json';
    }
    
    // Try to fetch the stats.json file
    fetch(statsJsonPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load stats.json: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Successfully loaded stats.json:', data);
            // Store the data in memory
            syncWithStatsJson(data);
            // Display the games
            loadGames();
        })
        .catch(error => {
            console.error('Error loading stats.json:', error);
            // Try alternate paths if the first one fails
            const alternatePaths = [
                '../stats.json',
                '/stats.json',
                'stats.json'
            ];
            
            let currentPathIndex = 0;
            const tryNextPath = () => {
                if (currentPathIndex >= alternatePaths.length) {
                    console.error('Failed to load stats.json from all paths');
                    return;
                }
                
                const path = alternatePaths[currentPathIndex++];
                console.log(`Trying alternate path: ${path}`);
                
                fetch(path)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to load ${path}: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log(`Successfully loaded ${path}:`, data);
                        syncWithStatsJson(data);
                        loadGames();
                    })
                    .catch(() => tryNextPath());
            };
            
            tryNextPath();
        });
}

// Sync data with stats.json
function syncWithStatsJson(data) {
    console.log('Synchronizing data from stats.json');
    
    // Store teams and players
    const teamKeys = Object.keys(data).filter(key => key.startsWith('players_'));
    teamKeys.forEach(teamKey => {
        const teamName = teamKey.replace('players_', '');
        const players = data[teamKey] || [];
        localStorage.setItem(`players_${teamName}`, JSON.stringify(players));
    });
    
    // Store games
    if (data.games && Array.isArray(data.games)) {
        localStorage.setItem('games', JSON.stringify(data.games));
    }
    
    // Store stats for each game
    const statKeys = Object.keys(data).filter(key => key.startsWith('stats_'));
    statKeys.forEach(statKey => {
        const gameId = statKey.replace('stats_', '');
        localStorage.setItem(statKey, JSON.stringify(data[statKey]));
    });
}

// Admin functionality
let isAdmin = false; // This should be set based on authentication

function initAdminControls() {
    if (!isAdmin) return;

    // Add admin button
    const adminBtn = document.createElement('div');
    adminBtn.className = 'admin-controls';
    adminBtn.innerHTML = `
        <div class="admin-btn" onclick="openAdminPanel()">
            <i class="fas fa-cog"></i>
        </div>
    `;
    document.body.appendChild(adminBtn);
}

function openAdminPanel() {
    // Create and show admin modal
    const adminModal = document.createElement('div');
    adminModal.className = 'modal';
    adminModal.id = 'admin-modal';
    adminModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeAdminPanel()">&times;</span>
            <h2>Administrācijas panelis</h2>
            <div class="admin-options">
                <button onclick="addNewGame()">Pievienot jaunu spēli</button>
                <button onclick="editGame()">Rediģēt spēli</button>
                <button onclick="addGameStats()">Pievienot statistiku</button>
                <button onclick="exportLocalStorageToFile()">Eksportēt datus</button>
            </div>
        </div>
    `;
    document.body.appendChild(adminModal);
    adminModal.classList.add('show');
}

function closeAdminPanel() {
    const adminModal = document.getElementById('admin-modal');
    if (adminModal) {
        adminModal.remove();
    }
}

function addNewGame() {
    // Implementation for adding a new game
    console.log('Adding new game...');
}

function editGame() {
    // Implementation for editing an existing game
    console.log('Editing game...');
}

function addGameStats() {
    // Implementation for adding game statistics
    console.log('Adding game statistics...');
}

// Initialize admin controls if user is admin
document.addEventListener('DOMContentLoaded', () => {
    initAdminControls();
});

// Load and display games
function loadGames() {
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    
    // Sort games by date and time
    games.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateA - dateB;
    });

    // Separate completed and upcoming games
    const now = new Date();
    const completedGames = games.filter(game => game.isCompleted);
    const upcomingGames = games.filter(game => !game.isCompleted);

    // Display latest completed games
    const latestGamesContainer = document.querySelector('.latest-games .game-cards');
    if (latestGamesContainer) {
        latestGamesContainer.innerHTML = '';
        completedGames.slice(-3).reverse().forEach(game => {
            latestGamesContainer.appendChild(createGameCard(game));
        });
    }

    // Display upcoming games
    const upcomingGamesContainer = document.querySelector('.upcoming-games .game-cards');
    if (upcomingGamesContainer) {
        upcomingGamesContainer.innerHTML = '';
        upcomingGames.slice(0, 3).forEach(game => {
            upcomingGamesContainer.appendChild(createGameCard(game));
        });
    }

    // Display games in tournament stages
    const tournamentStages = document.querySelector('.tournament-stages');
    if (tournamentStages) {
        displayTournamentStages(games);
    }
}

// Create a game card element
function createGameCard(game) {
    const div = document.createElement('div');
    div.className = 'game-card';
    
    const dateObj = new Date(game.date + 'T' + game.time);
    const formattedDate = dateObj.toLocaleDateString('lv-LV', {
        day: 'numeric',
        month: 'long'
    });

    if (game.isCompleted) {
        div.innerHTML = `
            <div class="game-time">${formattedDate}, ${game.time}</div>
            <div class="game-teams">
                <div class="team" title="${game.homeTeam}">${game.homeTeam}</div>
                <div class="score">${game.homeScore} <span class="score-separator">-</span> ${game.awayScore}</div>
                <div class="team" title="${game.awayTeam}">${game.awayTeam}</div>
            </div>
            <div class="game-details-btn" onclick="openGameStatsModal('${game.id}')">
                <i class="fas fa-chart-bar"></i> Statistika
            </div>
        `;
    } else {
        div.innerHTML = `
            <div class="game-time">${formattedDate}, ${game.time}</div>
            <div class="game-teams">
                <div class="team" title="${game.homeTeam}">${game.homeTeam}</div>
                <div class="score">VS</div>
                <div class="team" title="${game.awayTeam}">${game.awayTeam}</div>
            </div>
            <div class="game-location">
                <i class="fas fa-map-marker-alt"></i> ${game.location}
            </div>
        `;
    }

    return div;
}

// Display games organized by tournament stages
function displayTournamentStages(games) {
    const stages = {};
    games.forEach(game => {
        if (!stages[game.stage]) {
            stages[game.stage] = [];
        }
        stages[game.stage].push(game);
    });

    const tournamentStages = document.querySelector('.tournament-stages');
    tournamentStages.innerHTML = '';

    Object.keys(stages).sort().forEach(stage => {
        const stageGames = stages[stage];
        const firstGame = stageGames[0];
        const stageDate = new Date(firstGame.date);
        
        const stageElement = document.createElement('div');
        stageElement.className = 'tournament-stage';
        stageElement.innerHTML = `
            <div class="stage-header">
                <h2>${stage}. POSMS</h2>
                <div class="stage-info">
                    <span><i class="fas fa-calendar"></i> ${stageDate.toLocaleDateString('lv-LV', {
                        day: 'numeric',
                        month: 'long'
                    })}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${firstGame.location}</span>
                </div>
            </div>
            <div class="stage-games">
                ${stageGames.map(game => `
                    <div class="game-card" onclick="openGameStatsModal('${game.id}')">
                        <div class="game-time">${game.time}</div>
                        <div class="game-teams">
                            <div class="team" title="${game.homeTeam}">${game.homeTeam}</div>
                            <div class="score">${game.isCompleted ? `${game.homeScore} <span class="score-separator">-</span> ${game.awayScore}` : 'VS'}</div>
                            <div class="team" title="${game.awayTeam}">${game.awayTeam}</div>
                        </div>
                        ${game.isCompleted ? `
                            <div class="game-details-btn">
                                <i class="fas fa-chart-bar"></i> Statistika
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
        tournamentStages.appendChild(stageElement);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', loadGames);

function openGameStatsModal(gameId) {
    // Get games from localStorage
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    const game = games.find(g => g.id === gameId);
    
    if (!game) {
        console.error('Game not found:', gameId);
        return;
    }

    const modal = document.getElementById('game-stats-modal');
    if (!modal) {
        console.error('Modal not found');
        return;
    }

    // Update game info
    const gameInfo = modal.querySelector('.game-info');
    gameInfo.innerHTML = `
        <h3>${game.homeTeam} vs ${game.awayTeam}</h3>
        <p><i class="fas fa-calendar"></i> ${game.date}, ${game.time}</p>
        <p><i class="fas fa-map-marker-alt"></i> ${game.location}</p>
        <p><i class="fas fa-trophy"></i> Rezultāts: ${game.homeScore} - ${game.awayScore}</p>
    `;

    // Update team buttons
    const teamBtns = modal.querySelectorAll('.team-btn');
    teamBtns[0].textContent = game.homeTeam;
    teamBtns[1].textContent = game.awayTeam;
    
    // Reset active state
    teamBtns[0].classList.add('active');
    teamBtns[1].classList.remove('active');

    // Load initial stats
    loadTeamStats(game.homeTeam, gameId);

    // Add team switch functionality
    teamBtns.forEach(btn => {
        btn.onclick = () => {
            teamBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadTeamStats(btn.textContent, gameId);
        };
    });

    // Setup sort functionality for table headers
    setupSortingHeaders();

    // Show modal
    modal.style.display = 'block';
    modal.classList.add('show');
}

// Setup sorting functionality for table headers
function setupSortingHeaders() {
    // Setup batting stats table headers
    const battingHeaders = document.querySelectorAll('.batting-section .stats-table th');
    const battingStats = ['player', 'AB', 'H', '2B', '3B', 'HR', 'RBI', 'R', 'BB', 'SO', 'HBP', 'SF', 'SAC', 'SB', 'CS', 'AVG', 'OBP', 'SLG', 'OPS'];
    
    battingHeaders.forEach((header, index) => {
        header.setAttribute('data-stat', battingStats[index]);
        header.style.cursor = 'pointer';
        header.onclick = () => sortGameStats(header, 'batting');
    });
    
    // Setup pitching stats table headers
    const pitchingHeaders = document.querySelectorAll('.stats-section:not(.batting-section) .stats-table th');
    const pitchingStats = ['player', 'IP', 'H', 'R', 'ER', 'BB', 'SO', 'HR', 'BF', 'HBP', 'WP', 'BK', 'W', 'L', 'SV', 'ERA', 'WHIP', 'K/9', 'BB/9'];
    
    pitchingHeaders.forEach((header, index) => {
        header.setAttribute('data-stat', pitchingStats[index]);
        header.style.cursor = 'pointer';
        header.onclick = () => sortGameStats(header, 'pitching');
    });
}

function loadTeamStats(teamId, gameId) {
    // Get stats directly from localStorage which was populated from stats.json
    const stats = JSON.parse(localStorage.getItem(`stats_${gameId}`) || '{}');
    const teamStats = stats[teamId] || { batting: {}, pitching: {} };

    // Display batting stats
    const battingTbody = document.querySelector('.batting-stats');
    battingTbody.innerHTML = '';

    Object.entries(teamStats.batting).forEach(([playerId, stats]) => {
        const player = getPlayerInfo(playerId, teamId);
        if (!player) return;

        // Calculate derived stats
        const avg = stats.AB > 0 ? (stats.H / stats.AB).toFixed(3) : '.000';
        const obp = (stats.AB + stats.BB + stats.HBP + stats.SF) > 0 ? 
            ((stats.H + stats.BB + stats.HBP) / (stats.AB + stats.BB + stats.HBP + stats.SF)).toFixed(3) : '.000';
        const slg = stats.AB > 0 ? 
            ((stats.H + stats['2B'] + 2 * stats['3B'] + 3 * stats.HR) / stats.AB).toFixed(3) : '.000';
        const ops = (parseFloat(obp) + parseFloat(slg)).toFixed(3);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.firstName} ${player.lastName}</td>
            <td>${stats.AB}</td>
            <td>${stats.H}</td>
            <td>${stats['2B']}</td>
            <td>${stats['3B']}</td>
            <td>${stats.HR}</td>
            <td>${stats.RBI}</td>
            <td>${stats.R || 0}</td>
            <td>${stats.BB}</td>
            <td>${stats.SO}</td>
            <td>${stats.HBP}</td>
            <td>${stats.SF}</td>
            <td>${stats.SAC}</td>
            <td>${stats.SB}</td>
            <td>${stats.CS || 0}</td>
            <td>${avg}</td>
            <td>${obp}</td>
            <td>${slg}</td>
            <td>${ops}</td>
        `;
        battingTbody.appendChild(row);
    });

    // Display pitching stats
    const pitchingTbody = document.querySelector('.pitching-stats');
    pitchingTbody.innerHTML = '';

    Object.entries(teamStats.pitching).forEach(([playerId, stats]) => {
        const player = getPlayerInfo(playerId, teamId);
        if (!player) return;

        // Calculate derived stats
        const era = stats.IP > 0 ? ((stats.ER * 9) / stats.IP).toFixed(2) : '0.00';
        const whip = stats.IP > 0 ? ((stats.BB + stats.H) / stats.IP).toFixed(2) : '0.00';
        const k9 = stats.IP > 0 ? ((stats.SO * 9) / stats.IP).toFixed(1) : '0.0';
        const bb9 = stats.IP > 0 ? ((stats.BB * 9) / stats.IP).toFixed(1) : '0.0';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.firstName} ${player.lastName}</td>
            <td>${stats.IP.toFixed(1)}</td>
            <td>${stats.H}</td>
            <td>${stats.R}</td>
            <td>${stats.ER}</td>
            <td>${stats.BB}</td>
            <td>${stats.SO}</td>
            <td>${stats.HR}</td>
            <td>${stats.BF}</td>
            <td>${stats.HBP}</td>
            <td>${stats.WP}</td>
            <td>${stats.BK}</td>
            <td>${stats.W}</td>
            <td>${stats.L}</td>
            <td>${stats.SV}</td>
            <td>${era}</td>
            <td>${whip}</td>
            <td>${k9}</td>
            <td>${bb9}</td>
        `;
        pitchingTbody.appendChild(row);
    });
    
    // Setup sort functionality again since we've reloaded the table
    setupSortingHeaders();
}

function getPlayerInfo(playerId, teamId) {
    const players = JSON.parse(localStorage.getItem(`players_${teamId}`) || '[]');
    return players.find(p => p.id === playerId);
}

// Close modal functionality
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('game-stats-modal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}); 