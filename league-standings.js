// Calculate team standings from game results
function calculateStandings() {
    // Get all games from localStorage
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    
    // Initialize standings object
    const standings = {
        'ARCHERS': { games: 0, wins: 0, losses: 0, percentage: 0 },
        'SIGULDA': { games: 0, wins: 0, losses: 0, percentage: 0 },
        'PLATONE': { games: 0, wins: 0, losses: 0, percentage: 0 }
    };
    
    // Process completed games
    games.forEach(game => {
        if (!game.isCompleted) return;
        
        const homeTeam = game.homeTeam;
        const awayTeam = game.awayTeam;
        const homeScore = parseInt(game.homeScore);
        const awayScore = parseInt(game.awayScore);
        
        // Update home team stats
        standings[homeTeam].games++;
        if (homeScore > awayScore) {
            standings[homeTeam].wins++;
        } else {
            standings[homeTeam].losses++;
        }
        
        // Update away team stats
        standings[awayTeam].games++;
        if (awayScore > homeScore) {
            standings[awayTeam].wins++;
        } else {
            standings[awayTeam].losses++;
        }
    });
    
    // Calculate percentages and convert to array for sorting
    const teamsArray = Object.entries(standings).map(([team, stats]) => {
        stats.percentage = stats.games > 0 ? (stats.wins / stats.games) : 0;
        return {
            team,
            ...stats
        };
    });
    
    // Sort teams by percentage, then by number of wins
    teamsArray.sort((a, b) => {
        if (b.percentage !== a.percentage) {
            return b.percentage - a.percentage;
        }
        return b.wins - a.wins;
    });
    
    return teamsArray;
}

// Update standings table in the DOM
function updateStandingsTable() {
    const standings = calculateStandings();
    const tbody = document.querySelector('.standings-table tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    standings.forEach((team, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${team.team}</td>
            <td>${team.games}</td>
            <td>${team.wins}</td>
            <td>${team.losses}</td>
            <td>${team.percentage.toFixed(3).replace(/^0+/, '')}</td>
        `;
        tbody.appendChild(row);
    });
}

// Team Roster Modal Functionality
let currentTeam = '';
let currentStatsType = 'batting';
let currentSortField = '';
let currentSortDirection = 'desc';

// Define column configurations for different stat types
const statColumns = {
    batting: [
        { field: 'name', label: 'Spēlētājs', sortable: true },
        { field: 'G', label: 'G', sortable: true },
        { field: 'AB', label: 'AB', sortable: true },
        { field: 'H', label: 'H', sortable: true },
        { field: '2B', label: '2B', sortable: true },
        { field: '3B', label: '3B', sortable: true },
        { field: 'HR', label: 'HR', sortable: true },
        { field: 'RBI', label: 'RBI', sortable: true },
        { field: 'R', label: 'R', sortable: true },
        { field: 'BB', label: 'BB', sortable: true },
        { field: 'SO', label: 'SO', sortable: true },
        { field: 'HBP', label: 'HBP', sortable: true },
        { field: 'SF', label: 'SF', sortable: true },
        { field: 'SAC', label: 'SAC', sortable: true },
        { field: 'SB', label: 'SB', sortable: true },
        { field: 'CS', label: 'CS', sortable: true },
        { field: 'AVG', label: 'AVG', sortable: true },
        { field: 'OBP', label: 'OBP', sortable: true },
        { field: 'SLG', label: 'SLG', sortable: true },
        { field: 'OPS', label: 'OPS', sortable: true }
    ],
    pitching: [
        { field: 'name', label: 'Spēlētājs', sortable: true },
        { field: 'G', label: 'G', sortable: true },
        { field: 'IP', label: 'IP', sortable: true },
        { field: 'H', label: 'H', sortable: true },
        { field: 'R', label: 'R', sortable: true },
        { field: 'ER', label: 'ER', sortable: true },
        { field: 'BB', label: 'BB', sortable: true },
        { field: 'SO', label: 'SO', sortable: true },
        { field: 'HR', label: 'HR', sortable: true },
        { field: 'BF', label: 'BF', sortable: true },
        { field: 'HBP', label: 'HBP', sortable: true },
        { field: 'WP', label: 'WP', sortable: true },
        { field: 'BK', label: 'BK', sortable: true },
        { field: 'W', label: 'W', sortable: true },
        { field: 'L', label: 'L', sortable: true },
        { field: 'SV', label: 'SV', sortable: true },
        { field: 'ERA', label: 'ERA', sortable: true },
        { field: 'WHIP', label: 'WHIP', sortable: true },
        { field: 'K9', label: 'K/9', sortable: true },
        { field: 'BB9', label: 'BB/9', sortable: true }
    ]
};

// Default sort fields
const defaultSortFields = {
    batting: 'AVG',
    pitching: 'ERA'
};

// Setup modal event listeners
function setupModalEvents() {
    console.log('Setting up modal events');
    
    const modalElement = document.getElementById('team-roster-modal');
    if (!modalElement) {
        console.error('Roster modal element not found during setup!');
        return;
    }

    // Close button
    const closeButton = modalElement.querySelector('.close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            console.log('Modal close button clicked');
            modalElement.style.display = 'none';
            modalElement.classList.remove('show');
            // Restore body scrolling
            document.body.style.overflow = '';
        });
    } else {
        console.error('Close button not found!');
    }

    // Close when clicking outside the modal content
    window.addEventListener('click', (e) => {
        if (e.target === modalElement) {
            console.log('Clicked outside modal content, closing modal');
            modalElement.style.display = 'none';
            modalElement.classList.remove('show');
            // Restore body scrolling
            document.body.style.overflow = '';
        }
    });

    // Stats type tabs
    const statsTabs = modalElement.querySelectorAll('.tab-btn');
    if (statsTabs.length === 0) {
        console.error('Stats tabs not found!');
    }
    
    statsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            statsTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update current stats type
            currentStatsType = tab.getAttribute('data-stats-type');
            
            // Show/hide appropriate view
            const battingStats = document.getElementById('team-batting-stats');
            const pitchingStats = document.getElementById('team-pitching-stats');
            
            if (currentStatsType === 'batting') {
                battingStats.style.display = 'block';
                pitchingStats.style.display = 'none';
            } else {
                battingStats.style.display = 'none';
                pitchingStats.style.display = 'block';
            }
            
            // Reset sort to default for this type
            currentSortField = defaultSortFields[currentStatsType];
            currentSortDirection = currentStatsType === 'batting' ? 'desc' : 'asc';
            
            // Update the sort options dropdown
            updateSortOptions();
            
            // Reload the roster with the new stats type
            loadTeamRoster(currentTeam);
        });
    });

    // Sort dropdown
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const value = sortSelect.value;
            const [field, direction] = value.split('-');
            
            currentSortField = field;
            currentSortDirection = direction;
            
            // Reload roster with new sort
            loadTeamRoster(currentTeam);
        });
    }
}

// Update sort options based on current stats type
function updateSortOptions() {
    const sortSelect = document.getElementById('sort-by');
    if (!sortSelect) return;
    
    // Clear existing options
    sortSelect.innerHTML = '';
    
    // Add relevant options based on current stats type
    const columns = statColumns[currentStatsType];
    
    // Define field descriptions for tooltip/title attributes
    const fieldDescriptions = {
        // Batting
        'AB': 'At Bats',
        'H': 'Hits',
        '2B': 'Doubles',
        '3B': 'Triples',
        'HR': 'Home Runs',
        'RBI': 'Runs Batted In',
        'R': 'Runs Scored',
        'BB': 'Walks',
        'SO': 'Strikeouts',
        'HBP': 'Hit By Pitch',
        'SF': 'Sacrifice Flies',
        'SAC': 'Sacrifice Bunts',
        'SB': 'Stolen Bases',
        'CS': 'Caught Stealing',
        'AVG': 'Batting Average (H/AB)',
        'OBP': 'On-Base Percentage',
        'SLG': 'Slugging Percentage',
        'OPS': 'On-base Plus Slugging',
        
        // Pitching
        'IP': 'Innings Pitched',
        'ER': 'Earned Runs',
        'BF': 'Batters Faced',
        'HBP': 'Hit Batters',
        'WP': 'Wild Pitches',
        'BK': 'Balks',
        'W': 'Wins',
        'L': 'Losses',
        'SV': 'Saves',
        'ERA': 'Earned Run Average',
        'WHIP': 'Walks and Hits per Inning Pitched',
        'K9': 'Strikeouts per 9 innings',
        'BB9': 'Walks per 9 innings'
    };
    
    // Create option groups for better organization
    const createOptGroup = (label) => {
        const group = document.createElement('optgroup');
        group.label = label;
        return group;
    };
    
    // Create groups
    let groups = {
        main: createOptGroup('Galvenie rādītāji'),
        advanced: createOptGroup('Papildu rādītāji')
    };
    
    // Add main group to select
    sortSelect.appendChild(groups.main);
    sortSelect.appendChild(groups.advanced);
    
    // Define main fields for each stats type
    const mainFields = {
        batting: ['AVG', 'OPS', 'H', 'HR', 'RBI', 'R', 'SB'],
        pitching: ['ERA', 'WHIP', 'W', 'SO', 'IP', 'K9', 'SV']
    };
    
    columns.forEach(column => {
        if (!column.sortable || column.field === 'name') return;
        
        // Create options for ascending and descending sort
        const ascOption = document.createElement('option');
        ascOption.value = `${column.field}-asc`;
        ascOption.textContent = `${column.label} (Mazākais - Lielākais)`;
        if (fieldDescriptions[column.field]) {
            ascOption.title = fieldDescriptions[column.field];
        }
        
        const descOption = document.createElement('option');
        descOption.value = `${column.field}-desc`;
        descOption.textContent = `${column.label} (Lielākais - Mazākais)`;
        if (fieldDescriptions[column.field]) {
            descOption.title = fieldDescriptions[column.field];
        }
        
        // Determine which group this field belongs to
        const isMainField = mainFields[currentStatsType].includes(column.field);
        const targetGroup = isMainField ? groups.main : groups.advanced;
        
        // Add options to appropriate group
        // For fields where lower is better (like ERA, WHIP), put the ascending option first
        const invertedStats = ['ERA', 'WHIP', 'BB9'];
        if (invertedStats.includes(column.field)) {
            targetGroup.appendChild(ascOption);
            targetGroup.appendChild(descOption);
        } else {
            targetGroup.appendChild(descOption);
            targetGroup.appendChild(ascOption);
        }
        
        // Set selected option based on current sort
        if (column.field === currentSortField) {
            if (currentSortDirection === 'asc') {
                ascOption.selected = true;
            } else {
                descOption.selected = true;
            }
        }
    });
}

// Open team roster modal
function openTeamRoster(teamId) {
    console.log('Opening team roster modal for team:', teamId);
    
    const modalElement = document.getElementById('team-roster-modal');
    if (!modalElement) {
        console.error('Roster modal element not found!');
        return;
    }
    
    currentTeam = teamId;
    
    // Set default sort if not set
    if (!currentSortField) {
        currentSortField = defaultSortFields[currentStatsType];
        currentSortDirection = currentStatsType === 'batting' ? 'desc' : 'asc';
    }
    
    // Update the team name in the modal
    const teamNameEl = document.getElementById('team-name');
    if (teamNameEl) {
        teamNameEl.textContent = `${teamId} Komandas Sastāvs`;
    } else {
        console.error('Team name element not found!');
    }
    
    // Update sort options
    updateSortOptions();
    
    // Make sure the correct stats view is shown based on current type
    const battingStats = document.getElementById('team-batting-stats');
    const pitchingStats = document.getElementById('team-pitching-stats');
    
    if (battingStats && pitchingStats) {
        if (currentStatsType === 'batting') {
            battingStats.style.display = 'block';
            pitchingStats.style.display = 'none';
        } else {
            battingStats.style.display = 'none';
            pitchingStats.style.display = 'block';
        }
    }
    
    // Update active tab
    const statsTabs = modalElement.querySelectorAll('.tab-btn');
    statsTabs.forEach(tab => {
        if (tab.getAttribute('data-stats-type') === currentStatsType) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Load team roster
    loadTeamRoster(currentTeam);
    
    // Show modal directly with style changes rather than just class
    console.log('Showing modal with direct style changes');
    modalElement.style.display = 'flex';
    modalElement.classList.add('show');
    
    // Ensure body doesn't scroll while modal is open
    document.body.style.overflow = 'hidden';
}

// Load and display team roster
function loadTeamRoster(teamId) {
    console.log(`Loading team roster for team ${teamId}`);
    
    // Get team players from localStorage
    const players = JSON.parse(localStorage.getItem(`players_${teamId}`) || '[]');
    console.log(`Found ${players.length} players for team ${teamId}`);
    
    const modalElement = document.getElementById('team-roster-modal');
    if (!modalElement) {
        console.error('Modal element not found in loadTeamRoster');
        return;
    }
    
    // Get the correct view based on stats type
    const statsView = currentStatsType === 'batting' ? 
        document.getElementById('team-batting-stats') : 
        document.getElementById('team-pitching-stats');
    
    if (!statsView) {
        console.error(`Stats view not found for ${currentStatsType}`);
        return;
    }
    
    // Get the roster table body and head
    const rosterTable = statsView.querySelector('.roster-table');
    if (!rosterTable) {
        console.error('Roster table not found');
        return;
    }
    
    const rosterBody = rosterTable.querySelector('tbody');
    const rosterHead = rosterTable.querySelector('thead');
    
    if (!rosterBody || !rosterHead) {
        console.error('Roster table body or head not found', { rosterBody, rosterHead });
        return;
    }
    
    // Clear existing rows
    rosterBody.innerHTML = '';
    
    // Update headers based on stats type
    updateTableHeaders(rosterHead);
    
    // Add table highlighting effect
    setupTableHovering(rosterTable);
    
    // Show message if no players
    if (players.length === 0) {
        rosterBody.innerHTML = `
            <tr>
                <td colspan="${statColumns[currentStatsType].length}" class="no-players">
                    <i class="fas fa-info-circle"></i>
                    <p>Nav pievienotu spēlētāju šai komandai</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Get player stats
    const playerStats = getPlayerStats(teamId, players);
    
    // Sort player stats
    const sortedStats = sortPlayerStats(playerStats);
    
    // Add a "no stats available" message if all players have zero stats
    if (sortedStats.length > 0 && sortedStats.every(player => player.stats.G === 0)) {
        const statsTypeLabel = currentStatsType === 'batting' ? 'sitēju' : 'metēju';
        // Add one row to show a message about no stats
        const messageRow = document.createElement('tr');
        messageRow.innerHTML = `
            <td colspan="${statColumns[currentStatsType].length}" class="no-players">
                <i class="fas fa-chart-bar"></i>
                <p>Nav pieejami ${statsTypeLabel} statistikas dati šai komandai</p>
                <p>Statistika būs pieejama pēc spēļu rezultātu ievadīšanas</p>
            </td>
        `;
        rosterBody.appendChild(messageRow);
    } else {
        // Add rows for each player
        sortedStats.forEach(player => {
            const row = document.createElement('tr');
            
            // Add cells based on current stats type
            statColumns[currentStatsType].forEach(column => {
                const cell = document.createElement('td');
                
                // Style differently for name vs stats
                if (column.field === 'name') {
                    cell.textContent = player.name;
                    // Add player number if available
                    if (player.number) {
                        cell.innerHTML = `<strong>#${player.number}</strong> ${player.name}`;
                    }
                } else {
                    cell.classList.add('stats-value');
                    // Format and add stat value
                    const statValue = player.stats[column.field] || 0;
                    cell.textContent = formatStatValue(statValue, column.field);
                    
                    // Add data-column attribute for highlighting
                    cell.setAttribute('data-column', column.field);
                    
                    // Add visual indicator for standout stats
                    if (isStandoutStat(statValue, column.field, currentStatsType)) {
                        cell.classList.add('standout-stat');
                    }
                }
                
                row.appendChild(cell);
            });
            
            rosterBody.appendChild(row);
        });
    }
}

// Update table headers based on current stats type
function updateTableHeaders(headerRow) {
    if (!headerRow) return;
    
    // Clear existing headers
    headerRow.innerHTML = '';
    
    // Create header row
    const row = document.createElement('tr');
    
    // Add header cells
    statColumns[currentStatsType].forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.label;
        
        // Add data-column attribute for highlighting
        if (column.field !== 'name') {
            th.setAttribute('data-column', column.field);
        }
        
        if (column.sortable) {
            th.classList.add('sortable');
            
            // Add sort indicator if this is the current sort field
            if (column.field === currentSortField) {
                th.classList.add(currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
            
            // Add click handler for sorting
            th.addEventListener('click', () => {
                // If clicking the same column, toggle direction
                if (currentSortField === column.field) {
                    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    // New column, set default direction
                    currentSortField = column.field;
                    currentSortDirection = 'desc';
                }
                
                // Update sort dropdown to match
                const sortSelect = document.getElementById('sort-by');
                if (sortSelect) {
                    sortSelect.value = `${currentSortField}-${currentSortDirection}`;
                }
                
                // Reload with new sort
                loadTeamRoster(currentTeam);
            });
        }
        
        row.appendChild(th);
    });
    
    headerRow.appendChild(row);
}

// Get player stats (using actual data from localStorage instead of random generation)
function getPlayerStats(teamId, players) {
    console.log(`Getting real stats for team ${teamId} with ${players.length} players`);
    
    // We'll use the same calculation functions as the league-stats.js file
    function calculateDerivedBattingStats(stats) {
        // Calculate AVG
        stats.AVG = stats.AB > 0 ? (stats.H / stats.AB) : 0;
        
        // Calculate OBP
        const onBaseEvents = stats.H + stats.BB + stats.HBP;
        const onBaseOpportunities = stats.AB + stats.BB + stats.HBP + stats.SF;
        stats.OBP = onBaseOpportunities > 0 ? 
            (onBaseEvents / onBaseOpportunities) : 0;
        
        // Calculate SLG
        const bases = stats.H + stats['2B'] + (2 * stats['3B']) + (3 * stats.HR);
        stats.SLG = stats.AB > 0 ? (bases / stats.AB) : 0;
        
        // Calculate OPS
        stats.OPS = stats.OBP + stats.SLG;
    }

    function calculateDerivedPitchingStats(stats) {
        // Calculate ERA
        stats.ERA = stats.IP > 0 ? ((stats.ER * 9) / stats.IP) : 0;
        
        // Calculate WHIP
        stats.WHIP = stats.IP > 0 ? 
            ((stats.BB + stats.H) / stats.IP) : 0;
        
        // Calculate K/9
        stats.K9 = stats.IP > 0 ? 
            ((stats.SO * 9) / stats.IP) : 0;
        
        // Calculate BB/9
        stats.BB9 = stats.IP > 0 ? 
            ((stats.BB * 9) / stats.IP) : 0;
    }

    function createEmptyBattingStats() {
        return {
            G: 0, AB: 0, H: 0, '2B': 0, '3B': 0, HR: 0, RBI: 0, R: 0,
            BB: 0, SO: 0, HBP: 0, SF: 0, SAC: 0, SB: 0, CS: 0,
            AVG: 0, OBP: 0, SLG: 0, OPS: 0
        };
    }

    function createEmptyPitchingStats() {
        return {
            G: 0, IP: 0, H: 0, R: 0, ER: 0, BB: 0, SO: 0, HR: 0,
            BF: 0, HBP: 0, WP: 0, BK: 0, W: 0, L: 0, SV: 0,
            ERA: 0, WHIP: 0, K9: 0, BB9: 0
        };
    }
    
    // Get all games where this team participated
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    const teamGames = games.filter(game => 
        game.isCompleted && (game.homeTeam === teamId || game.awayTeam === teamId)
    );
    
    console.log(`Found ${teamGames.length} games for team ${teamId}`);
    
    // Initialize return array with player data
    const playerStats = players.map(player => {
        // Prepare player object with name and basic info
        return {
            id: player.id,
            name: `${player.firstName} ${player.lastName}`,
            number: player.number,
            stats: currentStatsType === 'batting' ? 
                createEmptyBattingStats() : createEmptyPitchingStats()
        };
    });
    
    // Process each game to accumulate stats
    teamGames.forEach(game => {
        const gameStatsKey = `stats_${game.id}`;
        const gameStats = JSON.parse(localStorage.getItem(gameStatsKey) || '{}');
        
        if (!gameStats[teamId]) {
            console.log(`No stats found for team ${teamId} in game ${game.id}`);
            return;
        }
        
        // Get team stats for this game
        const teamGameStats = gameStats[teamId];
        const statsTypeData = teamGameStats[currentStatsType] || {};
        
        // For each player, add their stats from this game
        playerStats.forEach(player => {
            const playerGameStats = statsTypeData[player.id];
            
            if (playerGameStats) {
                // Increment game count
                player.stats.G = (player.stats.G || 0) + 1;
                
                // Add stats from this game
                Object.entries(playerGameStats).forEach(([stat, value]) => {
                    if (stat !== 'G' && typeof value === 'number') {
                        player.stats[stat] = (player.stats[stat] || 0) + value;
                    }
                });
            }
        });
    });
    
    // Calculate derived stats for each player
    playerStats.forEach(player => {
        if (currentStatsType === 'batting') {
            calculateDerivedBattingStats(player.stats);
        } else {
            calculateDerivedPitchingStats(player.stats);
        }
    });
    
    // If no real stats were found, add some demo data for testing
    if (playerStats.every(p => p.stats.G === 0)) {
        console.log('No real stats found, adding demo data for testing');
        return addDemoData(teamId, players);
    }
    
    console.log('Final player stats:', playerStats);
    return playerStats;
}

// Sort player stats based on current sort field and direction
function sortPlayerStats(players) {
    return [...players].sort((a, b) => {
        // Special case for percentage stats
        const fieldA = a.stats[currentSortField] || 0;
        const fieldB = b.stats[currentSortField] || 0;
        
        // Handle string field (name)
        if (currentSortField === 'name') {
            return currentSortDirection === 'asc' 
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        }
        
        // Handle numeric fields
        const sortOrder = currentSortDirection === 'asc' ? 1 : -1;
        
        // For ERA, WHIP, and BB9, lower is better, so invert the sort order
        const invertedStats = ['ERA', 'WHIP', 'BB9'];
        const shouldInvert = invertedStats.includes(currentSortField);
        
        return shouldInvert
            ? (fieldA - fieldB) * sortOrder * -1
            : (fieldA - fieldB) * sortOrder;
    });
}

// Format stat values for display
function formatStatValue(value, field) {
    // Handle undefined or null values
    if (value === undefined || value === null) {
        return '0';
    }
    
    // Handle percentage stats
    const percentageStats = ['AVG', 'OBP', 'SLG', 'OPS'];
    if (percentageStats.includes(field)) {
        // Format to 3 decimal places and remove leading zero
        return value.toFixed(3).replace(/^0\./, '.');
    }
    
    // Handle ERA and other rate stats
    const rateStats = ['ERA', 'WHIP', 'K9', 'BB9'];
    if (rateStats.includes(field)) {
        return value.toFixed(2);
    }
    
    // Handle innings pitched (with decimal)
    if (field === 'IP') {
        return value.toFixed(1);
    }
    
    // Return integers for all other stats
    return Math.round(value).toString();
}

// Fallback function to generate demo stats if no real data exists
function addDemoData(teamId, players) {
    // Get games for this team
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    const teamGames = games.filter(game => game.isCompleted && (game.homeTeam === teamId || game.awayTeam === teamId));
    
    return players.map(player => {
        // Prepare player object with name and basic info
        const playerObj = {
            id: player.id,
            name: `${player.firstName} ${player.lastName}`,
            number: player.number,
            stats: {}
        };
        
        // Generate demo stats
        if (currentStatsType === 'batting') {
            const gamesPlayed = Math.min(teamGames.length, Math.floor(Math.random() * teamGames.length) + 1);
            const atBats = gamesPlayed * (Math.floor(Math.random() * 3) + 2);
            const hits = Math.floor(atBats * (Math.random() * 0.4 + 0.1));
            const doubles = Math.floor(hits * (Math.random() * 0.3));
            const triples = Math.floor(hits * (Math.random() * 0.1));
            const homers = Math.floor(hits * (Math.random() * 0.15));
            const singles = hits - doubles - triples - homers;
            const walks = Math.floor(atBats * (Math.random() * 0.2));
            const strikeouts = Math.floor(atBats * (Math.random() * 0.3));
            const rbis = Math.floor(hits * (Math.random() * 0.8));
            const runs = Math.floor(hits * (Math.random() * 0.6));
            const stolenBases = Math.floor(gamesPlayed * (Math.random() * 0.5));
            const caughtStealing = Math.floor(stolenBases * (Math.random() * 0.3));
            const hitByPitch = Math.floor(gamesPlayed * (Math.random() * 0.1));
            const sacrificeFly = Math.floor(gamesPlayed * (Math.random() * 0.1));
            const sacrificeBunt = Math.floor(gamesPlayed * (Math.random() * 0.1));
            
            // Calculate derived stats
            const battingAvg = atBats > 0 ? hits / atBats : 0;
            const onBasePct = (atBats + walks + hitByPitch + sacrificeFly) > 0 ? 
                (hits + walks + hitByPitch) / (atBats + walks + hitByPitch + sacrificeFly) : 0;
            const sluggingPct = atBats > 0 ? (singles + doubles * 2 + triples * 3 + homers * 4) / atBats : 0;
            const ops = onBasePct + sluggingPct;
            
            playerObj.stats = {
                G: gamesPlayed,
                AB: atBats,
                R: runs,
                H: hits,
                '2B': doubles,
                '3B': triples,
                HR: homers,
                RBI: rbis,
                BB: walks,
                SO: strikeouts,
                HBP: hitByPitch,
                SF: sacrificeFly,
                SAC: sacrificeBunt,
                SB: stolenBases,
                CS: caughtStealing,
                AVG: battingAvg,
                OBP: onBasePct,
                SLG: sluggingPct,
                OPS: ops
            };
        } else {
            // Pitching stats
            const gamesPlayed = Math.min(teamGames.length, Math.floor(Math.random() * teamGames.length / 2) + 1);
            const inningsPitched = gamesPlayed * (Math.floor(Math.random() * 3) + 2);
            const hits = Math.floor(inningsPitched * (Math.random() * 1.2));
            const walks = Math.floor(inningsPitched * (Math.random() * 0.5));
            const strikeouts = Math.floor(inningsPitched * (Math.random() * 1.2));
            const earnedRuns = Math.floor(inningsPitched * (Math.random() * 0.6));
            const runs = earnedRuns + Math.floor(Math.random() * 3);
            const homers = Math.floor(hits * (Math.random() * 0.15));
            const wins = Math.floor(gamesPlayed * (Math.random() * 0.6));
            const losses = gamesPlayed - wins;
            const hitBatters = Math.floor(inningsPitched * (Math.random() * 0.1));
            const wildPitches = Math.floor(inningsPitched * (Math.random() * 0.2));
            const balks = Math.floor(inningsPitched * (Math.random() * 0.05));
            const saves = Math.floor(wins * (Math.random() * 0.2));
            const battersfaced = hits + walks + strikeouts + hitBatters;
            
            // Calculate derived stats
            const era = inningsPitched > 0 ? (earnedRuns * 9) / inningsPitched : 0;
            const whip = inningsPitched > 0 ? (hits + walks) / inningsPitched : 0;
            const k9 = inningsPitched > 0 ? (strikeouts * 9) / inningsPitched : 0;
            const bb9 = inningsPitched > 0 ? (walks * 9) / inningsPitched : 0;
            
            playerObj.stats = {
                G: gamesPlayed,
                W: wins,
                L: losses,
                ERA: era,
                IP: inningsPitched,
                H: hits,
                R: runs,
                ER: earnedRuns,
                BB: walks,
                SO: strikeouts,
                HR: homers,
                BF: battersfaced,
                HBP: hitBatters,
                WP: wildPitches,
                BK: balks,
                SV: saves,
                WHIP: whip,
                K9: k9,
                BB9: bb9
            };
        }
        
        return playerObj;
    });
}

// Check if a stat value is exceptional
function isStandoutStat(value, field, statsType) {
    // No highlighting for zero values
    if (value === 0) return false;
    
    // Thresholds for batting stats
    const battingThresholds = {
        'AVG': 0.300,
        'OBP': 0.380,
        'SLG': 0.500,
        'OPS': 0.850,
        'HR': 5,
        'RBI': 15
    };
    
    // Thresholds for pitching stats (lower is better for some)
    const pitchingThresholds = {
        'ERA': 3.50,  // Below this is good
        'WHIP': 1.20, // Below this is good
        'K9': 9.0,    // Above this is good
        'W': 3,
        'SV': 2
    };
    
    if (statsType === 'batting' && battingThresholds[field]) {
        return value >= battingThresholds[field];
    } else if (statsType === 'pitching' && pitchingThresholds[field]) {
        // For ERA and WHIP, lower is better
        if (field === 'ERA' || field === 'WHIP') {
            return value <= pitchingThresholds[field];
        }
        return value >= pitchingThresholds[field];
    }
    
    return false;
}

// Setup column highlighting on hover
function setupTableHovering(table) {
    if (!table) return;
    
    // Remove any existing listeners by cloning the table
    const newTable = table.cloneNode(true);
    table.parentNode.replaceChild(newTable, table);
    
    // Add mouse enter/leave event listeners to table cells
    newTable.querySelectorAll('td[data-column], th[data-column]').forEach(cell => {
        cell.addEventListener('mouseenter', () => {
            const column = cell.getAttribute('data-column');
            highlightColumn(newTable, column);
        });
        
        cell.addEventListener('mouseleave', () => {
            clearHighlights(newTable);
        });
    });
    
    // Add the same for header cells
    newTable.querySelectorAll('th').forEach(headerCell => {
        const column = headerCell.getAttribute('data-column');
        if (!column) return;
        
        headerCell.addEventListener('mouseenter', () => {
            highlightColumn(newTable, column);
        });
        
        headerCell.addEventListener('mouseleave', () => {
            clearHighlights(newTable);
        });
    });
}

// Highlight a specific column
function highlightColumn(table, column) {
    table.querySelectorAll(`td[data-column="${column}"], th[data-column="${column}"]`).forEach(cell => {
        cell.classList.add('highlight-column');
    });
}

// Clear all column highlights
function clearHighlights(table) {
    table.querySelectorAll('.highlight-column').forEach(cell => {
        cell.classList.remove('highlight-column');
    });
}

// Initialize standings when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Update standings table
    updateStandingsTable();
    
    // Note: Team roster modal functionality has been removed
    // as users can access team player statistics directly from the statistics page
}); 