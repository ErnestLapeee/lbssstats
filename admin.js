// Check if the required DOM elements exist
// This must be the very first thing that runs
window.addEventListener('load', function() {
    console.log('=== ADMIN PANEL STARTUP DIAGNOSTICS ===');
    
    // Check if all needed elements exist
    const neededElements = [
        '#manage-players',
        '#team-select',
        '.players-list',
        '#add-player-form'
    ];
    
    neededElements.forEach(selector => {
        const element = document.querySelector(selector);
        console.log(`Element ${selector} exists: ${element ? 'YES' : 'NO'}`);
    });
    
    // Check if localStorage is working
    try {
        localStorage.setItem('_test', 'test');
        const testValue = localStorage.getItem('_test');
        console.log(`localStorage working: ${testValue === 'test' ? 'YES' : 'NO'}`);
        localStorage.removeItem('_test');
    } catch (e) {
        console.error('localStorage error:', e);
    }
    
    // Force load players after a delay if needed
    setTimeout(function() {
        const managePlayers = document.getElementById('manage-players');
        if (managePlayers && managePlayers.classList.contains('active')) {
            const teamSelect = document.getElementById('team-select');
            if (teamSelect) {
                console.log('Forcing initial player load for team:', teamSelect.value);
                loadTeamPlayers(teamSelect.value);
            }
        }
    }, 500);
});

// Tab functionality
function showTab(tabId) {
    console.log('Showing tab:', tabId);
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabId);
    selectedTab.style.display = 'block';
    selectedTab.classList.add('active');
    
    // Add active class to selected tab button
    document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');

    // Load content based on tab
    if (tabId === 'manage-games') {
        console.log('Loading games for manage-games tab');
        loadGames();
    } else if (tabId === 'manage-players') {
        console.log('Loading players for manage-players tab');
        const teamSelect = document.getElementById('team-select');
        if (teamSelect) {
            const team = teamSelect.value;
            console.log('Loading players for team:', team);
            
            // Use setTimeout to ensure the DOM has updated before loading players
            setTimeout(() => {
                loadTeamPlayers(team);
            }, 50);
        } else {
            console.error('Team select element not found in showTab');
        }
    }
}

// Show success message
function showSuccessMessage(message) {
    // Remove existing message if any
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageElement = document.createElement('div');
    messageElement.className = 'success-message';
    messageElement.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;

    const form = document.getElementById('add-game-form');
    form.parentNode.insertBefore(messageElement, form);

    // Remove message after 3 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

// Toggle score inputs based on game completion status
function toggleScoreInputs(checkbox) {
    const scoreInputs = document.querySelector('.score-inputs');
    scoreInputs.style.display = checkbox.checked ? 'grid' : 'none';
    
    const scoreFields = scoreInputs.querySelectorAll('input');
    scoreFields.forEach(field => {
        field.required = checkbox.checked;
        if (!checkbox.checked) {
            field.value = '';
        }
    });
}

// Load games from localStorage
function loadGames() {
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    const gamesList = document.querySelector('.games-list');
    gamesList.innerHTML = '';

    // Sort games by date and time
    games.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateB - dateA;
    });

    games.forEach(game => {
        const gameElement = createGameElement(game);
        gamesList.appendChild(gameElement);
    });

    if (games.length === 0) {
        gamesList.innerHTML = `
            <div class="no-games">
                <i class="fas fa-info-circle"></i>
                <p>Nav pievienotu spēļu</p>
            </div>
        `;
    }
}

// Create game element for the manage games list
function createGameElement(game) {
    const div = document.createElement('div');
    div.className = 'game-item';
    
    const dateObj = new Date(game.date + 'T' + game.time);
    const formattedDate = dateObj.toLocaleDateString('lv-LV', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const isUpcoming = new Date() < dateObj;
    const stageDisplay = game.stage ? `${game.stage}. POSMS` : 'POSMS NAV NORĀDĪTS';

    div.innerHTML = `
        <div class="game-info">
            <h3>${stageDisplay}</h3>
            <p><i class="fas fa-calendar"></i> ${formattedDate}, ${game.time}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${game.location}</p>
            <p><i class="fas fa-baseball-ball"></i> ${game.homeTeam} vs ${game.awayTeam}</p>
            ${game.isCompleted ? 
                `<p><i class="fas fa-trophy"></i> Rezultāts: ${game.homeScore} - ${game.awayScore}</p>` : 
                `<p><i class="fas fa-clock"></i> ${isUpcoming ? 'Gaidāma spēle' : 'Nav ievadīts rezultāts'}</p>`
            }
        </div>
        <div class="game-actions">
            ${game.isCompleted ? `
                <button class="action-btn" onclick="openGameStats('${game.id}')" title="Pievienot/Rediģēt statistiku">
                    <i class="fas fa-chart-bar"></i>
                </button>
            ` : ''}
            <button class="action-btn" onclick="editGame('${game.id}')" title="Rediģēt spēli">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn" onclick="deleteGame('${game.id}')" title="Dzēst spēli">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return div;
}

// Delete game
function deleteGame(gameId) {
    if (!gameId) {
        console.error('No game ID provided for deletion');
        return;
    }

    if (!confirm('Vai tiešām vēlaties dzēst šo spēli?')) return;
    
    try {
        const games = JSON.parse(localStorage.getItem('games') || '[]');
        console.log('Current games:', games);
        console.log('Attempting to delete game with ID:', gameId);
        
        // Convert gameId to number for comparison since it might be stored as a number
        const numericGameId = Number(gameId);
        const gameToDelete = games.find(g => g.id === gameId || g.id === numericGameId);
        
        if (!gameToDelete) {
            console.error('Game not found:', gameId);
            // Log all game IDs to help debug
            console.log('Available game IDs:', games.map(g => `${g.id} (${typeof g.id})`));
            return;
        }

        const updatedGames = games.filter(g => String(g.id) !== String(gameId));
        console.log('Games after deletion:', updatedGames);
        
        localStorage.setItem('games', JSON.stringify(updatedGames));
        loadGames();
        showSuccessMessage('Spēle veiksmīgi dzēsta!');
    } catch (error) {
        console.error('Error deleting game:', error);
        alert('Kļūda dzēšot spēli. Lūdzu, mēģiniet vēlreiz.');
    }
}

// Handle form submission
document.getElementById('add-game-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const editId = this.dataset.editId;
    
    const game = {
        id: editId || String(Date.now()),  // Ensure ID is always a string
        stage: formData.get('stage'),
        date: formData.get('date'),
        time: formData.get('time'),
        homeTeam: formData.get('home-team'),
        awayTeam: formData.get('away-team'),
        location: formData.get('location'),
        isCompleted: formData.get('is-completed') === 'on',
        homeScore: formData.get('home-score') || null,
        awayScore: formData.get('away-score') || null
    };
    
    try {
        const games = JSON.parse(localStorage.getItem('games') || '[]');
        
        if (editId) {
            // Update existing game
            const index = games.findIndex(g => g.id === editId);
            if (index !== -1) {
                games[index] = game;
            }
            delete this.dataset.editId;
            showSuccessMessage('Spēle veiksmīgi atjaunināta!');
        } else {
            // Add new game
            games.push(game);
            showSuccessMessage('Spēle veiksmīgi pievienota!');
        }
        
        localStorage.setItem('games', JSON.stringify(games));
        
        // Reset form
        this.reset();
        document.querySelector('.score-inputs').style.display = 'none';
        
        // Reload games list if we're on the manage tab
        if (document.querySelector('.tab-btn.active').getAttribute('onclick').includes('manage-games')) {
            loadGames();
        }

        // Update standings if the page exists
        if (typeof updateStandingsTable === 'function') {
            updateStandingsTable();
        }
    } catch (error) {
        console.error('Error saving game:', error);
        alert('Kļūda saglabājot spēli. Lūdzu, mēģiniet vēlreiz.');
    }
});

// Edit game
function editGame(gameId) {
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    const game = games.find(g => g.id === gameId);
    
    if (!game) return;
    
    // Switch to add game tab
    showTab('add-game');
    
    // Fill form with game data
    const form = document.getElementById('add-game-form');
    form.querySelector('[name="stage"]').value = game.stage;
    form.querySelector('[name="date"]').value = game.date;
    form.querySelector('[name="time"]').value = game.time;
    form.querySelector('[name="home-team"]').value = game.homeTeam;
    form.querySelector('[name="away-team"]').value = game.awayTeam;
    form.querySelector('[name="location"]').value = game.location;
    
    const completedCheckbox = form.querySelector('[name="is-completed"]');
    completedCheckbox.checked = game.isCompleted;
    toggleScoreInputs(completedCheckbox);
    
    if (game.isCompleted) {
        form.querySelector('[name="home-score"]').value = game.homeScore;
        form.querySelector('[name="away-score"]').value = game.awayScore;
    }
    
    // Update form submission to handle edit
    form.dataset.editId = gameId;
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
}

// Reset form
document.querySelector('button[type="reset"]').addEventListener('click', function(e) {
    const form = document.getElementById('add-game-form');
    delete form.dataset.editId;
    document.querySelector('.score-inputs').style.display = 'none';
});

// Function to load team players in the admin panel
function loadTeamPlayers(teamId) {
    console.log('Loading players for team:', teamId);
    
    // Direct debugging: Show what we're doing
    if (!teamId) {
        console.warn('No team ID provided, defaulting to ARCHERS');
        teamId = 'ARCHERS';
    }
    
    try {
        // Get container for player list
        const playersContainer = document.querySelector('#manage-players .players-list');
        if (!playersContainer) {
            console.error('Players list container not found. DOM structure might be incorrect.');
            return;
        }
        
        // First add a loading indicator
        playersContainer.innerHTML = '<div class="loading-indicator">Loading players...</div>';
        
        // Artificially delay to ensure the DOM has updated
        setTimeout(() => {
            try {
                // Get players from localStorage
                const storageKey = `players_${teamId}`;
                const playersJson = localStorage.getItem(storageKey);
                console.log(`Raw players data from localStorage for key ${storageKey}:`, playersJson);
                
                let players;
                try {
                    players = JSON.parse(playersJson || '[]');
                } catch (parseError) {
                    console.error('Error parsing player data:', parseError);
                    playersContainer.innerHTML = `
                        <div class="no-players">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Kļūda parsējot spēlētāju datus: ${parseError.message}</p>
                            <p>Raw data: ${playersJson?.substring(0, 50)}...</p>
                        </div>
                    `;
                    return;
                }
                
                console.log(`Found ${players.length} players for team ${teamId}:`, players);
                
                // Clear existing content
                playersContainer.innerHTML = '';
                
                // If no players, show a message and a direct add button
                if (!players || players.length === 0) {
                    playersContainer.innerHTML = `
                        <div class="no-players">
                            <i class="fas fa-info-circle"></i>
                            <p>Nav pievienotu spēlētāju šai komandai</p>
                            <button class="btn btn-primary" onclick="addTestPlayer()">
                                <i class="fas fa-plus"></i> Pievienot testa spēlētāju
                            </button>
                        </div>
                    `;
                    return;
                }
                
                // Create table to display players
                const playersTable = document.createElement('table');
                playersTable.className = 'players-table';
                
                // Add table header
                playersTable.innerHTML = `
                    <thead>
                        <tr>
                            <th>Numurs</th>
                            <th>Vārds</th>
                            <th>Uzvārds</th>
                            <th>Sit</th>
                            <th>Met</th>
                            <th>Darbības</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                
                // Sort players by number
                players.sort((a, b) => a.number - b.number);
                
                // Add players to table
                const tbody = playersTable.querySelector('tbody');
                players.forEach(player => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${player.number}</td>
                        <td>${player.firstName}</td>
                        <td>${player.lastName}</td>
                        <td>${getBattingHand(player.bats)}</td>
                        <td>${getThrowingHand(player.throws)}</td>
                        <td>
                            <button class="action-btn" title="Rediģēt" onclick="editPlayer('${player.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn" title="Dzēst" onclick="deletePlayer('${player.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                
                // Add table to container
                playersContainer.appendChild(playersTable);
                
                // Add count at the top
                const countDiv = document.createElement('div');
                countDiv.className = 'player-count';
                countDiv.innerHTML = `<strong>Kopā: ${players.length} spēlētāji</strong>`;
                countDiv.style.marginBottom = '10px';
                playersContainer.insertBefore(countDiv, playersTable);
                
                console.log('Players loaded successfully!');
            } catch (timeoutError) {
                console.error('Error in delayed loading:', timeoutError);
                playersContainer.innerHTML = `
                    <div class="no-players">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Kļūda ielādējot spēlētājus: ${timeoutError.message}</p>
                    </div>
                `;
            }
        }, 100);  // Short delay to ensure DOM updates
        
    } catch (error) {
        console.error('Error loading players:', error);
        const playersContainer = document.querySelector('#manage-players .players-list');
        if (playersContainer) {
            playersContainer.innerHTML = `
                <div class="no-players">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Kļūda ielādējot spēlētājus: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Helper function to get full batting hand text
function getBattingHand(code) {
    switch(code) {
        case 'R': return 'Ar labo';
        case 'L': return 'Ar kreiso';
        case 'S': return 'Abpusēji';
        default: return code;
    }
}

// Helper function to get full throwing hand text
function getThrowingHand(code) {
    switch(code) {
        case 'R': return 'Ar labo';
        case 'L': return 'Ar kreiso';
        default: return code;
    }
}

// Function to delete a player
function deletePlayer(playerId) {
    try {
        const teamId = document.getElementById('team-select').value;
        const players = JSON.parse(localStorage.getItem(`players_${teamId}`) || '[]');
        
        // Find the player to delete
        const playerToDelete = players.find(player => player.id === playerId);
        if (!playerToDelete) {
            console.error('Player not found:', playerId);
            return;
        }
        
        // Get player name for confirmation
        const playerName = `${playerToDelete.firstName} ${playerToDelete.lastName} (#${playerToDelete.number})`;
        
        // Confirm deletion
        if (!confirm(`Vai tiešām vēlaties dzēst spēlētāju ${playerName}?`)) {
            return;
        }
        
        // Delete player
        const updatedPlayers = players.filter(player => player.id !== playerId);
        localStorage.setItem(`players_${teamId}`, JSON.stringify(updatedPlayers));
        
        // Reload player list
        loadTeamPlayers(teamId);
        
        showSuccessMessage(`Spēlētājs ${playerName} veiksmīgi dzēsts!`);
    } catch (error) {
        console.error('Error deleting player:', error);
        alert('Kļūda dzēšot spēlētāju. Lūdzu, mēģiniet vēlreiz.');
    }
}

// Function to edit a player
function editPlayer(playerId) {
    try {
        const teamId = document.getElementById('team-select').value;
        const players = JSON.parse(localStorage.getItem(`players_${teamId}`) || '[]');
        const player = players.find(p => p.id === playerId);
        
        if (!player) return;
        
        // Fill form with player data
        const form = document.getElementById('add-player-form');
        form.querySelector('[name="firstName"]').value = player.firstName;
        form.querySelector('[name="lastName"]').value = player.lastName;
        form.querySelector('[name="number"]').value = player.number;
        form.querySelector('[name="bats"]').value = player.bats;
        form.querySelector('[name="throws"]').value = player.throws;
        
        // Set form for edit mode
        form.dataset.editId = playerId;
        form.dataset.teamId = teamId;
        
        // Change button text
        form.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Saglabāt izmaiņas';
        
        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error editing player:', error);
    }
}

// Add event listener for player form reset
document.getElementById('add-player-form').querySelector('button[type="reset"]').addEventListener('click', function() {
    const form = document.getElementById('add-player-form');
    delete form.dataset.editId;
    delete form.dataset.teamId;
    form.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Pievienot spēlētāju';
});

// Update player form submission to handle edits
document.getElementById('add-player-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const teamId = document.getElementById('team-select').value;
    const editId = this.dataset.editId;
    
    if (!teamId) {
        alert('Lūdzu izvēlieties komandu!');
        return;
    }
    
    const formData = new FormData(this);
    
    const player = {
        id: editId || String(Date.now()),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        number: Number(formData.get('number')),
        bats: formData.get('bats'),
        throws: formData.get('throws')
    };
    
    try {
        const storageKey = `players_${teamId}`;
        const players = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        if (editId) {
            // Update existing player
            const index = players.findIndex(p => p.id === editId);
            if (index !== -1) {
                players[index] = player;
                showSuccessMessage('Spēlētājs veiksmīgi atjaunināts!');
            }
            
            // Reset form edit mode
            delete this.dataset.editId;
            this.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Pievienot spēlētāju';
        } else {
            // Add new player
            players.push(player);
            showSuccessMessage('Spēlētājs veiksmīgi pievienots!');
        }
        
        localStorage.setItem(storageKey, JSON.stringify(players));
        this.reset();
        
        // Reload player list
        loadTeamPlayers(teamId);
        
    } catch (error) {
        console.error('Error saving player:', error);
        alert('Kļūda saglabājot spēlētāju. Lūdzu, mēģiniet vēlreiz.');
    }
});

// Debug function to show localStorage contents
function debugLocalStorage() {
    console.log('---- DEBUG: localStorage Contents ----');
    
    // Create a readable output of all localStorage items
    const output = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
            const value = JSON.parse(localStorage.getItem(key));
            output[key] = value;
        } catch (e) {
            output[key] = localStorage.getItem(key);
        }
    }
    
    console.log(output);
    
    // Find all player-related keys
    const playerKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('players_')) {
            playerKeys.push(key);
        }
    }
    
    console.log('Player keys found:', playerKeys);
    
    // Show alert with summary
    alert(`LocalStorage items: ${localStorage.length}\nPlayer keys: ${playerKeys.length}\nCheck console for details.`);
    
    // If the current team has no players, add a test player
    const teamId = document.getElementById('team-select').value;
    const players = JSON.parse(localStorage.getItem(`players_${teamId}`) || '[]');
    if (players.length === 0) {
        if (confirm(`No players found for team ${teamId}. Add a test player?`)) {
            addTestPlayer();
        }
    }
}

// Add this function to help with testing
function addTestPlayer() {
    const teamId = document.getElementById('team-select').value;
    const testPlayer = {
        id: Date.now().toString(),
        firstName: "Test",
        lastName: `Player ${Math.floor(Math.random() * 100)}`,
        number: Math.floor(Math.random() * 99) + 1,
        bats: "R",
        throws: "R"
    };
    
    // Get existing players
    const storageKey = `players_${teamId}`;
    const players = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Add the test player
    players.push(testPlayer);
    
    // Save back to localStorage
    localStorage.setItem(storageKey, JSON.stringify(players));
    
    console.log(`Added test player to team ${teamId}:`, testPlayer);
    console.log(`Current players for team ${teamId}:`, players);
    
    // Reload the player list
    loadTeamPlayers(teamId);
    
    // Show confirmation
    alert(`Test player added to team ${teamId}:\n#${testPlayer.number} ${testPlayer.firstName} ${testPlayer.lastName}`);
}

// Ensure loadTeamPlayers is called when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing admin panel...');
    
    // Remove duplicate event listeners by creating a clean initialization function
    initializeAdminPanel();
});

// Clear any duplicate event listeners
window.onload = function() {
    console.log('Window fully loaded, checking player loading...');
    // Force load players if manage-players tab is visible
    if (document.getElementById('manage-players').style.display === 'block') {
        const teamSelect = document.getElementById('team-select');
        if (teamSelect) {
            console.log('Forcing player load for team:', teamSelect.value);
            setTimeout(() => loadTeamPlayers(teamSelect.value), 100);
        }
    }
};

// Consolidated initialization function
function initializeAdminPanel() {
    // Show the first tab (add-game) by default
    showTab('add-game');
    
    // Add team selection change handler
    const teamSelect = document.getElementById('team-select');
    if (teamSelect) {
        // Remove any existing event listeners (won't work for anonymous functions but helps in some cases)
        teamSelect.replaceWith(teamSelect.cloneNode(true));
        
        // Get the fresh reference
        const freshTeamSelect = document.getElementById('team-select');
        console.log('Team select found, setting up event listener');
        
        freshTeamSelect.addEventListener('change', function() {
            const selectedTeam = this.value;
            console.log('Team changed to:', selectedTeam);
            loadTeamPlayers(selectedTeam);
        });
    } else {
        console.error('Team select element not found');
    }

    // Create a direct click handler for the manage-players tab
    const playerTabBtn = document.querySelector('[onclick="showTab(\'manage-players\')"]');
    if (playerTabBtn) {
        console.log('Found player tab button, adding direct click handler');
        playerTabBtn.addEventListener('click', function() {
            setTimeout(function() {
                const team = document.getElementById('team-select').value;
                console.log('Player tab clicked, loading players for team:', team);
                loadTeamPlayers(team);
            }, 100);
        });
    }
    
    // Create a "force load" button as a last resort
    const playersSection = document.querySelector('.players-section');
    if (playersSection) {
        const forceLoadBtn = document.createElement('button');
        forceLoadBtn.className = 'btn btn-primary';
        forceLoadBtn.innerHTML = '<i class="fas fa-sync"></i> Reload Players';
        forceLoadBtn.style.marginLeft = '10px';
        forceLoadBtn.onclick = function() {
            const team = document.getElementById('team-select').value;
            console.log('Force loading players for team:', team);
            loadTeamPlayers(team);
        };
        
        const teamSelectContainer = document.querySelector('.team-selection');
        if (teamSelectContainer) {
            teamSelectContainer.appendChild(forceLoadBtn);
        }
    }
}

// Update openGameStats function
function openGameStats(gameId) {
    // Call the openGameStatsModal function from game-stats.js
    openGameStatsModal(gameId);
}

// Export all data function
function exportAllData() {
    try {
        // Collect all localStorage data
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            try {
                data[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {
                data[key] = localStorage.getItem(key);
            }
        }
        
        // Convert to JSON string
        const jsonData = JSON.stringify(data, null, 2);
        
        // Create a blob and download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lbss-data-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
        
        console.log('Data exported successfully');
        alert('Dati veiksmīgi eksportēti!');
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Kļūda eksportējot datus: ' + error.message);
    }
}

// Import data function
function importData() {
    try {
        // Create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Update localStorage with imported data
                    Object.keys(data).forEach(key => {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                    });
                    
                    // Reload the current tab
                    const currentTab = document.querySelector('.tab-btn.active');
                    if (currentTab) {
                        const tabAction = currentTab.getAttribute('onclick');
                        if (tabAction) {
                            const tabMatch = tabAction.match(/'([^']+)'/);
                            if (tabMatch && tabMatch[1]) {
                                showTab(tabMatch[1]);
                            }
                        }
                    }
                    
                    console.log('Data imported successfully');
                    alert('Dati veiksmīgi importēti!');
                } catch (error) {
                    console.error('Error parsing imported data:', error);
                    alert('Kļūda importējot datus: ' + error.message);
                }
            };
            
            reader.readAsText(file);
        };
        
        document.body.appendChild(input);
        input.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(input);
        }, 0);
    } catch (error) {
        console.error('Error importing data:', error);
        alert('Kļūda importējot datus: ' + error.message);
    }
} 