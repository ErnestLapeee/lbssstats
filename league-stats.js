// Current view and sort state
let currentView = 'batting';
let currentSort = { stat: 'AVG', direction: 'desc' };

// Define a single implementation of showPlayerDetails that will be used globally
function showPlayerDetails(playerId, team, type) {
    console.log('showPlayerDetails called with:', playerId, team, type);
    
    try {
        // Get player data from localStorage
        const localData = localStorage.getItem('baseballStats');
        if (!localData) {
            alert('No player data available');
            return;
        }
        
        const data = JSON.parse(localData);
        
        // Find player details
        let playerDetails = null;
        
        // Check if data is in the new format with playerDetails
        if (data.playerDetails && data.playerDetails[playerId]) {
            playerDetails = data.playerDetails[playerId];
                } else {
            // Look for player in the players_TEAM arrays
            const teamKeys = Object.keys(data).filter(key => key.startsWith('players_'));
            for (const teamKey of teamKeys) {
                const players = data[teamKey] || [];
                const player = players.find(p => p.id === playerId);
                if (player) {
                    playerDetails = player;
                    break;
                }
            }
        }
        
        if (!playerDetails) {
            alert('Player details not found');
            return;
        }
        
        // Set player information in the modal
        document.getElementById('player-name').textContent = 
            `${playerDetails.firstName} ${playerDetails.lastName}`;
        document.getElementById('player-number').textContent = playerDetails.number;
        document.getElementById('player-team').textContent = team;
        document.getElementById('player-bats').textContent = formatBatsThrows(playerDetails.bats);
        document.getElementById('player-throws').textContent = formatBatsThrows(playerDetails.throws);
        
        // Set team logo
        const teamLogoElement = document.getElementById('player-team-logo');
        teamLogoElement.src = getTeamLogoUrl(team);
        teamLogoElement.alt = `${team} Logo`;
        
        // Force load all game statistics from the stored data
        const games = JSON.parse(localStorage.getItem('games') || '[]');
        
        // Get all game stats for this player directly from the stored data
        const gameKeys = Object.keys(data).filter(key => key.startsWith('stats_'));
        const playerGames = {
            batting: [],
            pitching: []
        };
        
        console.log(`Found ${gameKeys.length} game stats entries`);
        
        gameKeys.forEach(gameKey => {
            const gameId = gameKey.replace('stats_', '');
            const gameData = games.find(g => g.id === gameId);
            if (!gameData) {
                console.log(`Game data not found for ID: ${gameId}`);
                return;
            }
            
            const gameStats = data[gameKey];
            if (!gameStats || !gameStats[team]) {
                console.log(`No stats for team ${team} in game ${gameId}`);
                return;
            }
            
            // Check batting stats
            if (gameStats[team].batting && gameStats[team].batting[playerId]) {
                console.log(`Found batting stats for player ${playerId} in game ${gameId}`);
                playerGames.batting.push({
                    game: gameData,
                    stats: {
                        ...gameStats[team].batting[playerId],
                        team: team
                    }
                });
            }
            
            // Check pitching stats
            if (gameStats[team].pitching && gameStats[team].pitching[playerId]) {
                console.log(`Found pitching stats for player ${playerId} in game ${gameId}`);
                playerGames.pitching.push({
                    game: gameData,
                    stats: {
                        ...gameStats[team].pitching[playerId],
                        team: team
                    }
                });
            }
        });
        
        // Clear previous content
        document.getElementById('batting-games-stats').innerHTML = '';
        document.getElementById('pitching-games-stats').innerHTML = '';
        
        // Make sure games data is properly populated before displaying
        console.log(`Found ${playerGames.batting.length} batting games and ${playerGames.pitching.length} pitching games`);
        
        // Always display game stats, even if empty
        displayPlayerGameStats(playerGames.batting, 'batting', 'batting-games-stats');
        displayPlayerGameStats(playerGames.pitching, 'pitching', 'pitching-games-stats');
        
        // Show the appropriate stats view
        switchPlayerStatsView(type);
        
        // Show the modal
        const modal = document.getElementById('player-details-modal');
        modal.classList.add('show');
        
        // Ensure close button works
        const closeButton = modal.querySelector('.close');
        if (closeButton) {
            // Remove any existing event listeners by cloning and replacing the element
            const newCloseButton = closeButton.cloneNode(true);
            closeButton.parentNode.replaceChild(newCloseButton, closeButton);
            
            // Add the event listener
            newCloseButton.addEventListener('click', function() {
                closePlayerModal();
            });
        }
        
        // Ensure clicking outside the modal closes it
        window.addEventListener('click', function modalOutsideClickHandler(event) {
            if (event.target === modal) {
                closePlayerModal();
                // Remove this specific handler to avoid multiple handlers being added
                window.removeEventListener('click', modalOutsideClickHandler);
            }
        });
        
        // Ensure Escape key closes the modal
        document.addEventListener('keydown', function modalEscapeHandler(event) {
            if (event.key === 'Escape' && modal.classList.contains('show')) {
                closePlayerModal();
                // Remove this specific handler to avoid multiple handlers being added
                document.removeEventListener('keydown', modalEscapeHandler);
            }
        });
    } catch (e) {
        console.error('Error showing player details:', e);
        alert('Error loading player details: ' + e.message);
    }
}

// Make the function globally available right at the beginning
window.showPlayerDetails = showPlayerDetails;

// Add this at the top of the file, after the currentView and currentSort declarations
document.addEventListener('DOMContentLoaded', function() {
    // Set default view to batting
    currentView = 'batting';
    
    // Set the active button
    document.querySelectorAll('.stats-btn').forEach(btn => {
        if (btn.getAttribute('onclick').includes('batting')) {
            btn.classList.add('active');
        }
    });
    
    // Show batting stats table and hide pitching stats table
    document.getElementById('batting-stats').style.display = 'block';
    document.getElementById('pitching-stats').style.display = 'none';
    
    // Load the stats immediately
    loadStats();
    
    // Set up modal event listeners
    const modal = document.getElementById('player-details-modal');
    const closeBtn = modal.querySelector('.close');
    
    // Close the modal when the close button is clicked
    if (closeBtn) {
    closeBtn.addEventListener('click', function() {
        closePlayerModal();
    });
    }
    
    // Close the modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closePlayerModal();
        }
    });
    
    // Set up stats tabs event listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('onclick').includes('batting') ? 'batting' : 'pitching';
            switchPlayerStatsView(type);
        });
    });
    
    // Fix any onclick attributes on rows
    fixRowOnclickAttributes();
    
    // Set up a MutationObserver to watch for new rows being added to the tables
    setupTableObserver();
});

/**
 * Fix any onclick attributes on table rows by replacing them with event listeners
 */
function fixRowOnclickAttributes() {
    // Select all rows in the stats tables
    document.querySelectorAll('#batting-stats-body tr, #pitching-stats-body tr').forEach(row => {
        // If the row has an onclick attribute, replace it with an event listener
        if (row.hasAttribute('onclick')) {
            const onclickValue = row.getAttribute('onclick');
            row.removeAttribute('onclick'); // Remove the attribute
            
            // Parse the player ID and team from the onclick attribute
            const match = onclickValue.match(/showPlayerDetails\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/);
            if (match) {
                const playerId = match[1];
                const team = match[2];
                const type = match[3];
                
                row.addEventListener('click', function() {
                    showPlayerDetails(playerId, team, type);
                });
                
                console.log(`Fixed onclick for row with player ID ${playerId}`);
            }
        }
    });
}

/**
 * Close the player details modal
 */
function closePlayerModal() {
    const modal = document.getElementById('player-details-modal');
    
    // Remove the show class to hide the modal
    if (modal) {
    modal.classList.remove('show');
        console.log('Closed player modal from JS function');
    }
    
    // Clear content to prevent memory leaks
    const battingContainer = document.getElementById('batting-games-stats');
    const pitchingContainer = document.getElementById('pitching-games-stats');
    
    if (battingContainer) battingContainer.innerHTML = '';
    if (pitchingContainer) pitchingContainer.innerHTML = '';
}

/**
 * Switch between batting and pitching views in the player modal
 */
function switchPlayerStatsView(type) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    if (type === 'batting') {
        document.getElementById('batting-tab-btn').classList.add('active');
    } else {
        document.getElementById('pitching-tab-btn').classList.add('active');
    }

    // Show/hide appropriate stats view
    document.getElementById('player-batting-stats').style.display = type === 'batting' ? 'block' : 'none';
    document.getElementById('player-pitching-stats').style.display = type === 'pitching' ? 'block' : 'none';
}

// Make functions globally available
window.switchPlayerStatsView = switchPlayerStatsView;

/**
 * Format batting/throwing hand values
 */
function formatBatsThrows(value) {
    switch(value) {
        case 'R': return 'R';
        case 'L': return 'L';
        case 'S': return 'SWITCH';
        default: return value;
    }
}

// Make the function globally available
window.formatBatsThrows = formatBatsThrows;

/**
 * Helper function to get team logo URL
 */
function getTeamLogoUrl(team) {
    // Map team names to logo file paths
    const logoMap = {
        'ARCHERS': 'images/teams/archers.jpg',
        'SIGULDA': 'images/teams/sigulda.jpg',
        'PLATONE': 'images/teams/platone.jpg'
    };
    
    // Return the logo URL or a default placeholder
    return logoMap[team] || 'images/teams/default.jpg';
}

// Make the function globally available
window.getTeamLogoUrl = getTeamLogoUrl;

/**
 * Format a date object to a readable string
 */
function formatDate(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
        return 'N/A';
    }
    
    // Format the date as DD.MM.YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
}

/**
 * Display player statistics for specific games
 */
function displayPlayerGameStats(playerGames, type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear any existing content
    container.innerHTML = '';
    
    // If no games, show a message
    if (!playerGames || playerGames.length === 0) {
        container.innerHTML = '<p>Nav spēļu statistikas.</p>';
        return;
    }
    
    // Create a table for the stats
    const table = document.createElement('table');
    table.className = 'game-stats-table';
    
    // Set up the table headers based on type
    let headers;
    if (type === 'batting') {
        headers = ['Datums', 'Pretinieks', 'AB', 'H', '2B', '3B', 'HR', 'RBI', 'R', 'BB', 'SO', 'HBP', 'SF', 'SAC', 'SB', 'CS', 'AVG', 'OBP', 'SLG', 'OPS'];
    } else { // pitching
        headers = ['Datums', 'Pretinieks', 'IP', 'H', 'R', 'ER', 'BB', 'SO', 'HR', 'HBP', 'WP', 'BK', 'BF', 'ERA', 'WHIP', 'K/9', 'BB/9'];
    }
    
    // Track current sort state
    const sortState = {
        column: 'Datums', // Default sort by date
        direction: 'desc' // Default newest first
    };
    
    // Function to sort player games
    function sortPlayerGames(column) {
        // If clicking the same column, toggle direction
        if (sortState.column === column) {
            sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            sortState.column = column;
            // Set default direction based on column type
            if (['ERA', 'WHIP', 'BB/9'].includes(column)) {
                sortState.direction = 'asc'; // Lower is better
            } else {
                sortState.direction = 'desc'; // Higher is better for most stats
            }
        }
        
        // Sort the games array
        playerGames.sort((a, b) => {
            let valueA, valueB;
            
            // Handle date column special case
            if (column === 'Datums') {
                valueA = new Date(a.game.date);
                valueB = new Date(b.game.date);
                return sortState.direction === 'asc' 
                    ? valueA - valueB
                    : valueB - valueA;
            }
            
            // Handle opponent column special case
            if (column === 'Pretinieks') {
                const isHomeA = a.game.homeTeam === a.stats.team;
                const isHomeB = b.game.homeTeam === b.stats.team;
                const opponentA = isHomeA ? a.game.awayTeam : a.game.homeTeam;
                const opponentB = isHomeB ? b.game.awayTeam : b.game.homeTeam;
                return sortState.direction === 'asc' 
                    ? opponentA.localeCompare(opponentB)
                    : opponentB.localeCompare(opponentA);
            }
            
            // Get values for the specific column
            if (['AVG', 'OBP', 'SLG', 'OPS'].includes(column) && type === 'batting') {
                // Calculate derived stats for comparison
                const derivedStatsA = calculateBattingStats(a.stats);
                const derivedStatsB = calculateBattingStats(b.stats);
                valueA = parseFloat(derivedStatsA[column]);
                valueB = parseFloat(derivedStatsB[column]);
            } else if (['ERA', 'WHIP', 'K/9', 'BB/9'].includes(column) && type === 'pitching') {
                // Calculate derived stats for comparison
                const derivedStatsA = calculatePitchingStats(a.stats);
                const derivedStatsB = calculatePitchingStats(b.stats);
                valueA = parseFloat(derivedStatsA[column]);
                valueB = parseFloat(derivedStatsB[column]);
            } else if (column === 'IP' && type === 'pitching') {
                // Special handling for innings pitched
                valueA = convertIPToDecimal(a.stats[column] || 0);
                valueB = convertIPToDecimal(b.stats[column] || 0);
            } else {
                // For standard stats
                valueA = parseFloat(a.stats[column] || 0);
                valueB = parseFloat(b.stats[column] || 0);
            }
            
            // Handle NaN values
            if (isNaN(valueA)) valueA = 0;
            if (isNaN(valueB)) valueB = 0;
            
            // For ERA, WHIP, BB/9, lower is better, so invert the comparison
            const invertedStats = ['ERA', 'WHIP', 'BB/9'];
            const shouldInvert = invertedStats.includes(column);
            
            if (shouldInvert) {
                return sortState.direction === 'asc' ? valueA - valueB : valueB - valueA;
            } else {
                return sortState.direction === 'asc' ? valueA - valueB : valueB - valueA;
            }
        });
        
        // Redraw the table with sorted data
        renderTable();
    }
    
    // Function to render the table content
    function renderTable() {
        // Clear existing table content except headers
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
        
        // Add sorted rows
        playerGames.forEach(gameData => {
            const { game, stats } = gameData;
            
            // Create a new row
            const row = document.createElement('tr');
            
            // Get the data for this row
            const gameDate = game.date ? new Date(game.date) : new Date();
            const formattedDate = formatDate(gameDate);
            
            const isHomeTeam = game.homeTeam === stats.team;
            const opponent = isHomeTeam ? game.awayTeam : game.homeTeam;
            
            // Add cells based on type
            if (type === 'batting') {
                // Calculate derived stats for this game
                const derivedStats = calculateBattingStats(stats);
                
                // Create cells in the specific order matching headers
                const cells = [
                    formattedDate,                // Datums
                    opponent,                     // Pretinieks
                    stats.AB || 0,                // AB
                    stats.H || 0,                 // H
                    stats['2B'] || 0,             // 2B
                    stats['3B'] || 0,             // 3B
                    stats.HR || 0,                // HR
                    stats.RBI || 0,               // RBI
                    stats.R || 0,                 // R
                    stats.BB || 0,                // BB
                    stats.SO || 0,                // SO
                    stats.HBP || 0,               // HBP
                    stats.SF || 0,                // SF
                    stats.SAC || 0,               // SAC
                    stats.SB || 0,                // SB
                    stats.CS || 0,                // CS
                    derivedStats.AVG,             // AVG
                    derivedStats.OBP,             // OBP
                    derivedStats.SLG,             // SLG
                    derivedStats.OPS              // OPS
                ];
                
                // Add each cell to the row
                cells.forEach(value => {
                    const td = document.createElement('td');
                    td.textContent = value;
                    row.appendChild(td);
                });
            } else { // pitching
                // Calculate derived stats for this game
                const derivedStats = calculatePitchingStats(stats);
                
                // Format IP to one decimal place
                const formattedIP = parseFloat(stats.IP || 0).toFixed(1);
                
                // Create cells in the specific order matching headers
                const cells = [
                    formattedDate,                // Datums
                    opponent,                     // Pretinieks
                    formattedIP,                  // IP
                    stats.H || 0,                 // H
                    stats.R || 0,                 // R
                    stats.ER || 0,                // ER
                    stats.BB || 0,                // BB
                    stats.SO || 0,                // SO
                    stats.HR || 0,                // HR
                    stats.HBP || 0,               // HBP
                    stats.WP || 0,                // WP
                    stats.BK || 0,                // BK
                    stats.BF || 0,                // BF
                    derivedStats.ERA,             // ERA
                    derivedStats.WHIP,            // WHIP
                    derivedStats['K/9'],          // K/9
                    derivedStats['BB/9']          // BB/9
                ];
                
                // Add each cell to the row
                cells.forEach(value => {
                    const td = document.createElement('td');
                    td.textContent = value;
                    row.appendChild(td);
                });
            }
            
            table.appendChild(row);
        });
    }
    
    // Create header row with sorting
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        
        // Add hover effect for sorting
        th.style.cursor = 'pointer';
        
        // Add click handler for sorting
        th.addEventListener('click', () => {
            sortPlayerGames(header);
        });
        
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    
    // Add CSS for header hover effect
    const style = document.createElement('style');
    style.textContent = `
        .game-stats-table th:hover {
            background-color: #a61941 !important;
        }
    `;
    document.head.appendChild(style);
    
    // Initial render of the table
    renderTable();
    
    // Add the table to the container
    container.appendChild(table);
}

/**
 * Display player information and stats
 */
function displayPlayerStats(playerId, teamId) {
    console.log(`Displaying stats for player ${playerId} on team ${teamId}`);
    showPlayerDetails(playerId, teamId, 'batting');
}

/**
 * Display batting statistics table
 */
function displayBattingStats(battingStats) {
    const tableBody = document.getElementById('batting-stats-body');
    tableBody.innerHTML = '';
    
    if (battingStats.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="20" style="text-align: center;">Nav statistikas datu</td></tr>';
        return;
    }
    
    console.log(`Displaying batting stats for ${battingStats.length} players`);
    
    battingStats.forEach(playerStat => {
        // Ensure player has minimum playing time
        if (playerStat.stats.AB < 0) return;
        
        // Recalculate derived stats to ensure they're fresh and formatted correctly
        const derivedStats = calculateBattingStats({
            AB: playerStat.stats.AB,
            H: playerStat.stats.H,
            BB: playerStat.stats.BB,
            HBP: playerStat.stats.HBP,
            SF: playerStat.stats.SF,
            '2B': playerStat.stats['2B'],
            '3B': playerStat.stats['3B'],
            HR: playerStat.stats.HR
        });
        
        // Update the player's stats with the freshly calculated values
        playerStat.stats.AVG = derivedStats.AVG;
        playerStat.stats.OBP = derivedStats.OBP;
        playerStat.stats.SLG = derivedStats.SLG;
        playerStat.stats.OPS = derivedStats.OPS;
        
        const row = document.createElement('tr');
        row.className = 'clickable';
        
        // Set player ID and team as data attributes for easy access
        row.setAttribute('data-player-id', playerStat.id);
        row.setAttribute('data-team', playerStat.team);
        
        const team = playerStat.team;
        row.innerHTML = `
            <td>${getPlayerName(playerStat.id, playerStat.playerDetails)}</td>
            <td>${team}</td>
            <td>${playerStat.stats.AB}</td>
            <td>${playerStat.stats.H}</td>
            <td>${playerStat.stats['2B']}</td>
            <td>${playerStat.stats['3B']}</td>
            <td>${playerStat.stats.HR}</td>
            <td>${playerStat.stats.RBI}</td>
            <td>${playerStat.stats.R}</td>
            <td>${playerStat.stats.BB}</td>
            <td>${playerStat.stats.SO}</td>
            <td>${playerStat.stats.HBP}</td>
            <td>${playerStat.stats.SF}</td>
            <td>${playerStat.stats.SAC}</td>
            <td>${playerStat.stats.SB}</td>
            <td>${playerStat.stats.CS}</td>
            <td>${playerStat.stats.AVG}</td>
            <td>${playerStat.stats.OBP}</td>
            <td>${playerStat.stats.SLG}</td>
            <td>${playerStat.stats.OPS}</td>
        `;
        
        row.addEventListener('click', function() {
            displayPlayerStats(playerStat.id, playerStat.team);
        });
        
        tableBody.appendChild(row);
    });
    
    console.log('Batting stats table updated');
}

/**
 * Display pitching statistics table
 */
function displayPitchingStats(pitchingStats) {
    const tableBody = document.getElementById('pitching-stats-body');
    tableBody.innerHTML = '';
    
    if (pitchingStats.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="20" style="text-align: center;">Nav statistikas datu</td></tr>';
        return;
    }
    
    pitchingStats.forEach(playerStat => {
        // Ensure pitcher has minimum playing time
        if (playerStat.stats.IP < 0) return;
        
        const row = document.createElement('tr');
        row.className = 'clickable';
        
        // Set player ID and team as data attributes for easy access
        row.setAttribute('data-player-id', playerStat.id);
        row.setAttribute('data-team', playerStat.team);
        
        const team = playerStat.team;
        row.innerHTML = `
            <td>${getPlayerName(playerStat.id, playerStat.playerDetails)}</td>
            <td>${team}</td>
            <td>${playerStat.stats.IP}</td>
            <td>${playerStat.stats.H}</td>
            <td>${playerStat.stats.R}</td>
            <td>${playerStat.stats.ER}</td>
            <td>${playerStat.stats.BB}</td>
            <td>${playerStat.stats.SO}</td>
            <td>${playerStat.stats.HR}</td>
            <td>${playerStat.stats.BF}</td>
            <td>${playerStat.stats.HBP}</td>
            <td>${playerStat.stats.WP}</td>
            <td>${playerStat.stats.BK}</td>
            <td>${playerStat.stats.W}</td>
            <td>${playerStat.stats.L}</td>
            <td>${playerStat.stats.SV}</td>
            <td>${playerStat.stats.ERA}</td>
            <td>${playerStat.stats.WHIP}</td>
            <td>${playerStat.stats['K/9']}</td>
            <td>${playerStat.stats['BB/9']}</td>
        `;
        
        row.addEventListener('click', function() {
            displayPlayerStats(playerStat.id, playerStat.team);
        });
        
        tableBody.appendChild(row);
    });
}

/**
 * Switch between batting and pitching stats views
 */
function switchStatsView(view) {
    console.log(`Switching to ${view} view`);
    
    // Update current view
    currentView = view;
    
    // Update active button
    document.querySelectorAll('.stats-btn').forEach(btn => {
        btn.classList.remove('active');
        if (view === 'batting' && btn.textContent.trim().includes('Sitēji')) {
            btn.classList.add('active');
        } else if (view === 'pitching' && btn.textContent.trim().includes('Pičeri')) {
            btn.classList.add('active');
        }
    });
    
    // Show/hide appropriate stats table
    if (view === 'batting') {
        document.getElementById('batting-stats').style.display = 'block';
        document.getElementById('pitching-stats').style.display = 'none';
    } else {
        document.getElementById('batting-stats').style.display = 'none';
        document.getElementById('pitching-stats').style.display = 'block';
    }
    
    // Reset sort state
    if (view === 'batting') {
        currentSort = { stat: 'AVG', direction: 'desc' };
    } else {
        currentSort = { stat: 'ERA', direction: 'asc' };
    }
    
    // Apply current sort
    sortStats(view, currentSort.stat);
    
    console.log(`Switched to ${view} stats view`);
}

/**
 * Filter stats by team
 */
function filterStats() {
    const teamFilter = document.getElementById('team-filter');
    const selectedTeam = teamFilter ? teamFilter.value : '';
    
    console.log(`Filtering stats by team: ${selectedTeam || 'All'}`);
    
    // Get all player rows in both tables
    const battingRows = document.querySelectorAll('#batting-stats-body tr');
    const pitchingRows = document.querySelectorAll('#pitching-stats-body tr');
    
    // Filter batting stats
    battingRows.forEach(row => {
        const rowTeam = row.getAttribute('data-team');
        if (!selectedTeam || rowTeam === selectedTeam) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    // Filter pitching stats
    pitchingRows.forEach(row => {
        const rowTeam = row.getAttribute('data-team');
        if (!selectedTeam || rowTeam === selectedTeam) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Set up a MutationObserver to watch for changes to the stats tables
 */
function setupTableObserver() {
    // Create a new MutationObserver
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if any tr elements were added
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'TR') {
                        // Fix any onclick attributes on the new row
                        if (node.hasAttribute('onclick')) {
                            const onclickValue = node.getAttribute('onclick');
                            node.removeAttribute('onclick'); // Remove the attribute
                            
                            // Parse the player ID and team from the onclick attribute
                            const match = onclickValue.match(/showPlayerDetails\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/);
                            if (match) {
                                const playerId = match[1];
                                const team = match[2];
                                const type = match[3];
                                
                                node.addEventListener('click', function() {
                                    showPlayerDetails(playerId, team, type);
                                });
                                
                                console.log(`Fixed onclick for new row with player ID ${playerId}`);
                            }
                        }
                    }
                });
            }
        });
    });
    
    // Start observing the batting stats table
    observer.observe(document.getElementById('batting-stats-body'), { childList: true });
    
    // Start observing the pitching stats table
    observer.observe(document.getElementById('pitching-stats-body'), { childList: true });
    
    console.log('Set up MutationObserver for stats tables');
}

// Immediately load statistics when the script is executed
(function() {
    // Load stats as soon as script is executed
    console.log('Auto-loading statistics immediately');
    
    // If DOM is already loaded, load stats right away
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        loadStats();
    } else {
        // Otherwise wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', function() {
            loadStats();
        });
    }
})();

/**
 * Helper function to synchronize localStorage with the provided data
 */
function syncLocalStorage(data) {
    // Ensure games are stored in localStorage
    if (data.games) {
        localStorage.setItem('games', JSON.stringify(data.games));
    }
    
    // Store team player lists
    Object.keys(data).forEach(key => {
        if (key.startsWith('players_')) {
            localStorage.setItem(key, JSON.stringify(data[key]));
        }
    });
    
    // Store game stats
    Object.keys(data).forEach(key => {
        if (key.startsWith('stats_')) {
            localStorage.setItem(key, JSON.stringify(data[key]));
        }
    });
}

/**
 * Get table headers for the specified stat type (without explanations)
 */
function getStatsTableHeaders(type) {
    if (type === 'batting') {
        return ['AB', 'H', '2B', '3B', 'HR', 'RBI', 'R', 'BB', 'SO', 'HBP', 'SF', 'SAC', 'SB', 'CS', 'AVG', 'OBP', 'SLG', 'OPS'];
    } else { // pitching
        return ['IP', 'H', 'R', 'ER', 'BB', 'SO', 'HR', 'BF', 'HBP', 'WP', 'BK', 'W', 'L', 'SV', 'ERA', 'WHIP', 'K/9', 'BB/9'];
    }
}

// Make the function globally available
window.getStatsTableHeaders = getStatsTableHeaders;

/**
 * Get player name from its ID and details object
 */
function getPlayerName(playerId, playerDetails) {
    if (playerDetails) {
        return `${playerDetails.firstName} ${playerDetails.lastName}`;
    }
    
    // Fallback - try to get name from local storage
    try {
        const baseballStats = JSON.parse(localStorage.getItem('baseballStats') || '{}');
        if (baseballStats.playerDetails && baseballStats.playerDetails[playerId]) {
            const details = baseballStats.playerDetails[playerId];
            return `${details.firstName} ${details.lastName}`;
        }
    } catch (e) {
        console.error('Error getting player name from localStorage:', e);
    }
    
    return `Player ${playerId}`;
}

// Make the function globally available
window.getPlayerName = getPlayerName;

/**
 * Load statistics from an external JSON file or localStorage
 */
function loadStats() {
    // Show loading message
    document.getElementById('batting-stats-body').innerHTML = '<tr><td colspan="20" style="text-align: center;">Ielādē statistiku...</td></tr>';
    document.getElementById('pitching-stats-body').innerHTML = '<tr><td colspan="20" style="text-align: center;">Ielādē statistiku...</td></tr>';
    
    console.log('Loading statistics...');
    
    // First try to load from localStorage
    const localData = localStorage.getItem('baseballStats');
    let hasLocalData = false;
    
    if (localData) {
        try {
            const data = JSON.parse(localData);
            console.log('Found data in localStorage:', data);
            
            // Also make sure games data is in localStorage
            if (!localStorage.getItem('games') && data.games) {
                console.log('Synchronizing games data to localStorage');
                localStorage.setItem('games', JSON.stringify(data.games));
            }
            
            const convertedData = convertStatsFormat(data);
            console.log('Converted data:', convertedData);
            
            displayStats(convertedData);
            hasLocalData = true;
        } catch (e) {
            console.error('Error parsing localStorage data:', e);
        }
    }
    
    // Then try to fetch from stats.json to update/supplement the data
    console.log('Attempting to fetch latest data from stats.json');
    
    // Try multiple possible paths for stats.json
    const possiblePaths = [
        'stats.json',
        '../stats.json',
        './stats.json',
        '/stats.json',
        '/lbss/stats.json'
    ];
    
    // Try each path in sequence
    function tryNextPath(index) {
        if (index >= possiblePaths.length) {
            console.log('Could not load stats.json from any path');
            if (!hasLocalData) {
                console.log('No local data available, using fallback data');
                useFallbackData();
            }
            return;
        }
        
        const path = possiblePaths[index];
        console.log(`Trying to load stats.json from: ${path}`);
        
        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Successfully loaded stats.json from:', path);
                console.log('Retrieved data:', data);
                
                // Compare with existing data
                const existingData = localStorage.getItem('baseballStats');
                if (existingData) {
                    try {
                    const oldData = JSON.parse(existingData);
                    // Only update if there are differences
                    if (JSON.stringify(oldData) !== JSON.stringify(data)) {
                        console.log('Found new or updated data in stats.json');
                        updateLocalStorage(data);
                    } else {
                        console.log('No changes in stats.json data');
                        }
                    } catch (e) {
                        console.error('Error comparing with existing data:', e);
                        updateLocalStorage(data); // Update anyway if there's an error
                    }
                } else {
                    console.log('No existing data, storing new data');
                    updateLocalStorage(data);
                }
            })
            .catch(error => {
                console.warn(`Failed to load from ${path}:`, error);
                // Try next path
                tryNextPath(index + 1);
            });
    }
    
    // Start trying paths
    tryNextPath(0);
}

/**
 * Update localStorage with the provided data
 */
function updateLocalStorage(data) {
    localStorage.setItem('baseballStats', JSON.stringify(data));
    
    // Also ensure games are stored separately for easier access
    if (data.games) {
        localStorage.setItem('games', JSON.stringify(data.games));
    }
    
    // Sync individual components
    syncLocalStorage(data);
    
    // Convert and display the stats
    const convertedData = convertStatsFormat(data);
    displayStats(convertedData);
}

/**
 * Use fallback data if no stats are available
 */
function useFallbackData() {
    const fallbackData = {
        batting: [],
        pitching: []
    };
    
    displayStats(fallbackData);
}

/**
 * Convert the stats from the game stats format to the league stats format
 */
function convertStatsFormat(data) {
    console.log('Converting stats format from game data...');
    const battingStats = [];
    const pitchingStats = [];
    
    try {
        // Get all games from data or localStorage
        const games = data.games || JSON.parse(localStorage.getItem('games') || '[]');
        console.log(`Found ${games.length} games in data`);
        
        // Get all game stats entries
        const gameKeys = Object.keys(data).filter(key => key.startsWith('stats_'));
        console.log(`Found ${gameKeys.length} game stat entries`);
        
        // Process each team's player roster
        const teamKeys = Object.keys(data).filter(key => key.startsWith('players_'));
        console.log(`Found ${teamKeys.length} team rosters`);
        
        teamKeys.forEach(teamKey => {
            const teamId = teamKey.replace('players_', '');
            const players = data[teamKey] || [];
            
            console.log(`Processing ${players.length} players from team ${teamId}`);
            
            // Process each player individually
            players.forEach(player => {
                // Process batting stats
                const playerBattingGames = [];
                
                // Collect all batting stats for this player from all games
                gameKeys.forEach(gameKey => {
                    const gameStats = data[gameKey];
                    if (!gameStats || !gameStats[teamId] || !gameStats[teamId].batting) {
                        return;
                    }
                    
                    const playerStats = gameStats[teamId].batting[player.id];
                    if (playerStats) {
                        const gameId = gameKey.replace('stats_', '');
                        const game = games.find(g => g.id === gameId);
                        if (game) {
                            playerBattingGames.push({
                                game: game,
                                stats: { ...playerStats, team: teamId }
                            });
                        }
                    }
                });
                
                // If player has batting stats in any games
                if (playerBattingGames.length > 0) {
                    // Calculate total batting stats
                    const totalStats = createEmptyBattingStats();
                    
                    // Sum up all non-derived stats
                    playerBattingGames.forEach(gameData => {
                        Object.keys(gameData.stats).forEach(stat => {
                            if (!['AVG', 'OBP', 'SLG', 'OPS', 'team'].includes(stat)) {
                                totalStats[stat] += parseInt(gameData.stats[stat] || 0);
                            }
                        });
                    });
                    
                    // Calculate derived stats
                    const derivedStats = calculateBattingStats(totalStats);
                    totalStats.AVG = derivedStats.AVG;
                    totalStats.OBP = derivedStats.OBP;
                    totalStats.SLG = derivedStats.SLG;
                    totalStats.OPS = derivedStats.OPS;
                    
                    // Add to batting stats array
                    battingStats.push({
                        id: player.id,
                        team: teamId,
                        stats: totalStats,
                        playerDetails: player
                    });
                    
                    console.log(`Added player ${player.firstName} ${player.lastName} batting stats: AB=${totalStats.AB}, H=${totalStats.H}`);
                }
                
                // Process pitching stats
                const playerPitchingGames = [];
                
                // Collect all pitching stats for this player from all games
                gameKeys.forEach(gameKey => {
                    const gameStats = data[gameKey];
                    if (!gameStats || !gameStats[teamId] || !gameStats[teamId].pitching) {
                        return;
                    }
                    
                    const playerStats = gameStats[teamId].pitching[player.id];
                    if (playerStats) {
                        const gameId = gameKey.replace('stats_', '');
                        const game = games.find(g => g.id === gameId);
                        if (game) {
                            playerPitchingGames.push({
                                game: game,
                                stats: { ...playerStats, team: teamId }
                            });
                        }
                    }
                });
                
                // If player has pitching stats in any games
                if (playerPitchingGames.length > 0) {
                    // Calculate total pitching stats
                    const totalStats = createEmptyPitchingStats();
                    
                    // Sum up all non-derived stats
                    playerPitchingGames.forEach(gameData => {
                        Object.keys(gameData.stats).forEach(stat => {
                            if (!['ERA', 'WHIP', 'K/9', 'BB/9', 'team'].includes(stat)) {
                                if (stat === 'IP') {
                                    totalStats[stat] += parseFloat(gameData.stats[stat] || 0);
            } else {
                                    totalStats[stat] += parseInt(gameData.stats[stat] || 0);
                                }
                            }
                        });
                    });
                    
                    // Format IP to one decimal place
                    totalStats.IP = parseFloat(totalStats.IP).toFixed(1);
                    
                    // Calculate derived stats
                    const derivedStats = calculatePitchingStats(totalStats);
                    totalStats.ERA = derivedStats.ERA;
                    totalStats.WHIP = derivedStats.WHIP;
                    totalStats['K/9'] = derivedStats['K/9'];
                    totalStats['BB/9'] = derivedStats['BB/9'];
                    
                    // Add to pitching stats array
                    pitchingStats.push({
                        id: player.id,
                        team: teamId,
                        stats: totalStats,
                        playerDetails: player
                    });
                    
                    console.log(`Added player ${player.firstName} ${player.lastName} pitching stats: IP=${totalStats.IP}, SO=${totalStats.SO}`);
                }
            });
        });
        
        console.log(`Conversion complete. Collected ${battingStats.length} batting stats and ${pitchingStats.length} pitching stats.`);
        
    } catch (error) {
        console.error('Error converting stats format:', error);
    }
    
    return { battingStats, pitching: pitchingStats };
}

/**
 * Calculate derived batting statistics
 */
function calculateBattingStats(stats) {
    // Initialize all stats to avoid NaN
    const singles = (stats.H || 0) - ((stats['2B'] || 0) + (stats['3B'] || 0) + (stats.HR || 0));
    const ab = stats.AB || 0;
    const h = stats.H || 0;
    const bb = stats.BB || 0;
    const hbp = stats.HBP || 0;
    const sf = stats.SF || 0;
    
    // Calculate derived stats
    let avg = ab > 0 ? (h / ab) : 0;
    let obp = (ab + bb + hbp + sf) > 0 ? ((h + bb + hbp) / (ab + bb + hbp + sf)) : 0;
    let slg = ab > 0 ? ((singles + 2 * (stats['2B'] || 0) + 3 * (stats['3B'] || 0) + 4 * (stats.HR || 0)) / ab) : 0;
    let ops = obp + slg;
    
    // Format values as strings with proper decimal places without leading dot
    const AVG = avg.toFixed(3);
    const OBP = obp.toFixed(3);
    const SLG = slg.toFixed(3);
    const OPS = ops.toFixed(3);
    
    return { AVG, OBP, SLG, OPS };
}

/**
 * Calculate derived pitching statistics
 */
function calculatePitchingStats(stats) {
    // Ensure all values are numbers
    const ip = parseFloat(stats.IP) || 0;
    const er = parseInt(stats.ER) || 0;
    const bb = parseInt(stats.BB) || 0;
    const h = parseInt(stats.H) || 0;
    const so = parseInt(stats.SO) || 0;
    
    // Calculate ERA: (ER × 9) ÷ IP
    const era = ip > 0 ? (er * 9) / ip : 0;
    
    // Calculate WHIP: (BB + H) ÷ IP
    const whip = ip > 0 ? (bb + h) / ip : 0;
    
    // Calculate K/9: (SO × 9) ÷ IP
    const k9 = ip > 0 ? (so * 9) / ip : 0;
    
    // Calculate BB/9: (BB × 9) ÷ IP
    const bb9 = ip > 0 ? (bb * 9) / ip : 0;
    
    // Format values properly
    const ERA = era.toFixed(2);
    const WHIP = whip.toFixed(2);
    const K9 = k9.toFixed(1);
    const BB9 = bb9.toFixed(1);
    
    return {
        'ERA': ERA,
        'WHIP': WHIP,
        'K/9': K9,
        'BB/9': BB9
    };
}

/**
 * Display the statistics in the tables
 */
function displayStats(data) {
    if (!data) {
        console.error('No data provided to displayStats');
        return;
    }
    
    console.log('Displaying stats with data:', data);
    
    // Extract batting and pitching stats from the data
    const batting = data.battingStats || [];
    const pitching = data.pitching || [];
    
    console.log(`Displaying stats for ${batting.length} batters and ${pitching.length} pitchers`);
    
    // Sort batting stats by AVG (descending)
    batting.sort((a, b) => {
        const avgA = parseFloat(a.stats.AVG.startsWith('.') ? '0' + a.stats.AVG : a.stats.AVG);
        const avgB = parseFloat(b.stats.AVG.startsWith('.') ? '0' + b.stats.AVG : b.stats.AVG);
        return avgB - avgA;
    });
    
    // Sort pitching stats by ERA (ascending)
    pitching.sort((a, b) => {
        const eraA = parseFloat(a.stats.ERA);
        const eraB = parseFloat(b.stats.ERA);
        return eraA - eraB;
    });
    
    // Display the stats in the tables
    displayBattingStats(batting);
    displayPitchingStats(pitching);
    
    // Set up click handlers for the rows
    setUpPlayerRowClickHandlers();
}

/**
 * Set up click handlers for player rows
 */
function setUpPlayerRowClickHandlers() {
    document.querySelectorAll('#batting-stats-body tr, #pitching-stats-body tr').forEach(row => {
        if (row.hasAttribute('data-player-id') && row.hasAttribute('data-team')) {
            const playerId = row.getAttribute('data-player-id');
            const team = row.getAttribute('data-team');
            
            // Make sure the row doesn't already have a click handler
            if (!row.getAttribute('has-click-handler')) {
                row.addEventListener('click', function() {
                    const type = row.closest('#batting-stats-body') ? 'batting' : 'pitching';
                    showPlayerDetails(playerId, team, type);
                });
                row.setAttribute('has-click-handler', 'true');
                console.log(`Added click handler for player ${playerId} (${team})`);
                        }
                    }
                });
            }

// Make sure the function is globally available
window.loadStats = loadStats;
window.displayStats = displayStats;
window.setUpPlayerRowClickHandlers = setUpPlayerRowClickHandlers;

/**
 * Sort stats based on the current sort state
 */
function sortStats(type, stat) {
    console.log(`Sorting ${type} stats by ${stat}`);
    
    // Update current sort state
    if (currentSort.stat === stat) {
        // Toggle direction if clicking the same column
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // Set new sort column with appropriate default direction
        currentSort.stat = stat;
        
        // Default sorting direction based on stat type
        if (['ERA', 'WHIP', 'BB/9'].includes(stat)) {
            // For these stats, lower is better, so default to ascending
            currentSort.direction = 'asc';
        } else {
            // For most stats, higher is better, so default to descending
            currentSort.direction = 'desc';
        }
    }
    
    // Update header classes for sort indicators
    const headers = document.querySelectorAll(`#${type}-stats th`);
    headers.forEach(header => {
        // Remove all sort classes
        header.classList.remove('sort-asc', 'sort-desc');
        
        // Add appropriate class to the current sort column
        if (header.getAttribute('data-stat') === stat) {
            header.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
    
    // Get all rows in the table
    const rows = document.querySelectorAll(`#${type}-stats-body tr`);
    
    // Convert rows to an array for sorting
    const rowsArray = Array.from(rows);
    
    // Sort the rows
    rowsArray.sort((a, b) => {
        let valueA, valueB;
        
        if (stat === 'name') {
            valueA = a.cells[0].textContent.trim();
            valueB = b.cells[0].textContent.trim();
            return currentSort.direction === 'asc' 
                ? valueA.localeCompare(valueB) 
                : valueB.localeCompare(valueA);
        }
        
        if (stat === 'team') {
            valueA = a.cells[1].textContent.trim();
            valueB = b.cells[1].textContent.trim();
            return currentSort.direction === 'asc' 
                ? valueA.localeCompare(valueB) 
                : valueB.localeCompare(valueA);
        }
        
        // Get column index based on the stat
        let columnIndex = -1;
        const headers = document.querySelectorAll(`#${type}-stats th`);
        headers.forEach((header, index) => {
            if (header.getAttribute('data-stat') === stat) {
                columnIndex = index;
            }
        });
        
        if (columnIndex === -1) return 0;
        
        // Get cell values
        const cellA = a.cells[columnIndex];
        const cellB = b.cells[columnIndex];
        
        if (!cellA || !cellB) {
            console.error('Missing cell during sorting', { stat, columnIndex, rowA: a, rowB: b });
            return 0;
        }
        
        // Parse values appropriately
        if (['AVG', 'OBP', 'SLG', 'OPS'].includes(stat)) {
            // Convert string to float, properly handling values with or without leading zeros
            valueA = parseFloat(cellA.textContent.trim() || 0);
            valueB = parseFloat(cellB.textContent.trim() || 0);
            
            // Handle NaN values
            if (isNaN(valueA)) valueA = 0;
            if (isNaN(valueB)) valueB = 0;
        } else if (stat === 'IP') {
            // Special handling for innings pitched
            const textA = cellA.textContent.trim();
            const textB = cellB.textContent.trim();
            
            // Convert IP to decimal (e.g., "5.1" -> 5.333, "5.2" -> 5.666)
            valueA = convertIPToDecimal(textA);
            valueB = convertIPToDecimal(textB);
        } else if (['ERA', 'WHIP', 'K/9', 'BB/9'].includes(stat)) {
            // For decimal stats like ERA, WHIP
            valueA = parseFloat(cellA.textContent.trim() || 0);
            valueB = parseFloat(cellB.textContent.trim() || 0);
            
            // Handle NaN values
            if (isNaN(valueA)) valueA = 0;
            if (isNaN(valueB)) valueB = 0;
        } else {
            // For integer stats
            valueA = parseInt(cellA.textContent.trim() || 0);
            valueB = parseInt(cellB.textContent.trim() || 0);
            
            // Handle NaN values
            if (isNaN(valueA)) valueA = 0;
            if (isNaN(valueB)) valueB = 0;
        }
        
        // For ERA, WHIP, BB/9, lower is better, so invert the sort order
        const invertedStats = ['ERA', 'WHIP', 'BB/9'];
        const shouldInvert = invertedStats.includes(stat);
        
        if (shouldInvert) {
            return currentSort.direction === 'asc' ? valueA - valueB : valueB - valueA;
        } else {
            return currentSort.direction === 'asc' ? valueA - valueB : valueB - valueA;
        }
    });
    
    // Clear existing rows
    const tableBody = document.getElementById(`${type}-stats-body`);
    tableBody.innerHTML = '';
    
    // Append sorted rows
    rowsArray.forEach(row => {
        tableBody.appendChild(row);
    });
    
    console.log(`${type} stats sorted by ${stat} (${currentSort.direction})`);
    
    // Add event listeners to the sorted rows
    setUpPlayerRowClickHandlers();
}

/**
 * Convert innings pitched (IP) from baseball notation to decimal format
 * In baseball: "5.1" means 5⅓ innings (5 + 1/3) = 5.333... decimal
 *             "5.2" means 5⅔ innings (5 + 2/3) = 5.666... decimal
 */
function convertIPToDecimal(ip) {
    if (!ip) return 0;
    
    // Handle already-decimal values
    const ipString = String(ip);
    
    // Split by decimal point
    const parts = ipString.split('.');
    if (parts.length === 1) {
        // No decimal point, it's a whole number of innings
        return parseFloat(ip);
    }
    
    const whole = parseInt(parts[0], 10);
    const fractionalPart = parts[1];
    
    // Baseball specific conversion - the digit after decimal represents outs, not decimal
    // In baseball, there are 3 outs per inning
    if (fractionalPart === '1') {
        // .1 in baseball notation means ⅓ of an inning (1 out)
        return whole + (1/3);
    } else if (fractionalPart === '2') {
        // .2 in baseball notation means ⅔ of an inning (2 outs)
        return whole + (2/3);
    } else {
        // For other values, assume decimal (though unusual in baseball notation)
        return parseFloat(ip);
    }
}

// Add DOMContentLoaded event to ensure fonts, styles, and modal visibility are correct
document.addEventListener('DOMContentLoaded', function() {
    // Set up the stats type selector buttons 
    const battingBtn = document.getElementById('batting-btn');
    const pitchingBtn = document.getElementById('pitching-btn');
    
    if (battingBtn) {
        battingBtn.addEventListener('click', function() {
            switchStatsView('batting');
        });
        console.log('Added click listener to batting button');
    }
    
    if (pitchingBtn) {
        pitchingBtn.addEventListener('click', function() {
            switchStatsView('pitching');
        });
        console.log('Added click listener to pitching button');
    }
    
    // Set up team filter
    const teamFilter = document.getElementById('team-filter');
    if (teamFilter) {
        teamFilter.addEventListener('change', function() {
            filterStats();
        });
        console.log('Added change listener to team filter');
    }
    
    // Set up player stats tab buttons
    const battingTabBtn = document.getElementById('batting-tab-btn');
    const pitchingTabBtn = document.getElementById('pitching-tab-btn');
    
    if (battingTabBtn) {
        battingTabBtn.addEventListener('click', function() {
            switchPlayerStatsView('batting');
        });
        console.log('Added click listener to player batting tab button');
    }
    
    if (pitchingTabBtn) {
        pitchingTabBtn.addEventListener('click', function() {
            switchPlayerStatsView('pitching');
        });
        console.log('Added click listener to player pitching tab button');
    }
    
    // Initialize the page with batting stats view
    switchStatsView('batting');
    
    // Apply consistent styling to all tables and fonts
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        /* Global font and table styles for consistency */
        .stats-table, .all-games-table, #batting-stats, #pitching-stats, .player-modal {
            font-family: 'Montserrat', Arial, sans-serif !important;
            font-size: 14px !important;
        }
        
        /* All table cells should have consistent text color */
        .stats-table td, .all-games-table td, 
        #batting-stats td, #pitching-stats td, 
        .player-modal td, .player-modal th,
        .stats-table th, .all-games-table th, 
        #batting-stats th, #pitching-stats th {
            color: #333 !important;
        }
        
        /* Ensure text in player modal is visible */
        .player-modal h2, 
        .player-modal p, 
        .player-modal button, 
        .player-modal td,
        .player-modal th,
        .player-modal .stats-tabs,
        .player-modal .game-info-header,
        .player-modal .player-info,
        .player-modal .stats-header,
        .player-modal .all-games-table td,
        .all-games-table td {
            color: #333 !important;
        }
        
        /* Set header background to maroon with white text for all tables */
        .player-modal th,
        .player-modal .stats-header,
        .player-modal .game-info-header,
        .all-games-table th,
        .stats-table th,
        #batting-stats th,
        #pitching-stats th {
            background-color: #8b1538 !important;
            color: white !important;
            font-weight: 500 !important;
            padding: 0.6rem 0.4rem !important;
            text-align: center !important;
            position: relative !important;
            cursor: pointer !important;
        }
        
        /* Sorting indicators for table headers */
        #batting-stats th, #pitching-stats th {
            position: relative;
            cursor: pointer;
        }
        
        #batting-stats th:hover, #pitching-stats th:hover {
            background-color: #a61941 !important;
        }
        
        /* Remove triangle indicators */
        #batting-stats th::after, #pitching-stats th::after,
        #batting-stats th.sort-asc::after, #pitching-stats th.sort-asc::after,
        #batting-stats th.sort-desc::after, #pitching-stats th.sort-desc::after {
            content: '' !important;
        }
        
        /* Consistent table styling */
        .all-games-table, .stats-table, #batting-stats table, #pitching-stats table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 1rem !important;
        }
        
        /* Alternating row colors for readability */
        .all-games-table tr:nth-child(even),
        .stats-table tr:nth-child(even),
        #batting-stats tbody tr:nth-child(even),
        #pitching-stats tbody tr:nth-child(even) {
            background-color: #f9f9f9 !important;
        }
    `;
    document.head.appendChild(modalStyle);

    // Set up click handlers after a small delay to ensure rows are created
    setTimeout(function() {
        setUpPlayerRowClickHandlers();
    }, 1000);
    
    // Add modal close functionality
    const modal = document.getElementById('player-details-modal');
    const closeBtn = modal.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closePlayerModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closePlayerModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.classList.contains('show')) {
            closePlayerModal();
        }
    });
    
    // Initialize the data
    loadStats();
});

/**
 * Get empty batting stats object
 */
function createEmptyBattingStats() {
    return {
        AB: 0,
        H: 0,
        '2B': 0,
        '3B': 0,
        HR: 0,
        RBI: 0,
        R: 0,
        BB: 0,
        SO: 0,
        HBP: 0,
        SF: 0,
        SAC: 0,
        SB: 0,
        CS: 0,
        AVG: '.000',
        OBP: '.000',
        SLG: '.000',
        OPS: '.000'
    };
}

/**
 * Get empty pitching stats object
 */
function createEmptyPitchingStats() {
    return {
        IP: 0,
        H: 0,
        R: 0,
        ER: 0,
        BB: 0,
        SO: 0,
        HR: 0,
        BF: 0,
        HBP: 0,
        WP: 0,
        BK: 0,
        W: 0,
        L: 0,
        SV: 0,
        ERA: '0.00',
        WHIP: '0.00',
        'K/9': '0.00',
        'BB/9': '0.00'
    };
} 