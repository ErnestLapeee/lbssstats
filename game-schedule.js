function openGameStatsModal(gameId) {
    const modal = document.getElementById('game-stats-modal');
    const game = getGameById(gameId);
    if (!game) return;

    // Update game info
    const gameInfo = modal.querySelector('.game-info');
    gameInfo.innerHTML = `
        <p><strong>${game.homeTeam} vs ${game.awayTeam}</strong></p>
        <p>Datums: ${formatDate(game.date)}</p>
        <p>Rezultāts: ${game.homeScore} - ${game.awayScore}</p>
    `;

    // Set team buttons
    const teamBtns = modal.querySelectorAll('.team-btn');
    teamBtns[0].textContent = game.homeTeam;
    teamBtns[1].textContent = game.awayTeam;

    // Load initial stats
    loadGameStats(gameId, game.homeTeam);

    modal.style.display = 'block';
}

function loadGameStats(gameId, team) {
    const stats = JSON.parse(localStorage.getItem(`stats_${gameId}`) || '{}');
    const teamStats = stats[team] || { batting: {}, pitching: {} };

    displayBattingStats(teamStats.batting);
    displayPitchingStats(teamStats.pitching);
}

function displayBattingStats(stats) {
    const tbody = document.querySelector('.batting-stats');
    tbody.innerHTML = '';

    Object.entries(stats).forEach(([playerId, playerStats]) => {
        const player = getPlayerInfo(playerId);
        if (!player) return;

        // Calculate derived stats
        const derivedStats = calculateBattingStats(playerStats);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.firstName} ${player.lastName}</td>
            <td>${playerStats.AB || 0}</td>
            <td>${playerStats.H || 0}</td>
            <td>${playerStats['2B'] || 0}</td>
            <td>${playerStats['3B'] || 0}</td>
            <td>${playerStats.HR || 0}</td>
            <td>${playerStats.RBI || 0}</td>
            <td>${playerStats.R || 0}</td>
            <td>${playerStats.BB || 0}</td>
            <td>${playerStats.SO || 0}</td>
            <td>${playerStats.HBP || 0}</td>
            <td>${playerStats.SF || 0}</td>
            <td>${playerStats.SAC || 0}</td>
            <td>${playerStats.SB || 0}</td>
            <td>${playerStats.CS || 0}</td>
            <td>${derivedStats.AVG}</td>
            <td>${derivedStats.OBP}</td>
            <td>${derivedStats.SLG}</td>
            <td>${derivedStats.OPS}</td>
        `;
        tbody.appendChild(row);
    });
}

function calculateBattingStats(stats) {
    const singles = (stats.H || 0) - ((stats['2B'] || 0) + (stats['3B'] || 0) + (stats.HR || 0));
    const ab = stats.AB || 0;
    const h = stats.H || 0;
    const bb = stats.BB || 0;
    const hbp = stats.HBP || 0;
    const sf = stats.SF || 0;

    return {
        AVG: ab > 0 ? (h / ab).toFixed(3) : '.000',
        OBP: (ab + bb + hbp + sf) > 0 ? 
            ((h + bb + hbp) / (ab + bb + hbp + sf)).toFixed(3) : '.000',
        SLG: ab > 0 ? 
            ((singles + 2 * (stats['2B'] || 0) + 3 * (stats['3B'] || 0) + 4 * (stats.HR || 0)) / ab).toFixed(3) : '.000',
        get OPS() { return (parseFloat(this.OBP) + parseFloat(this.SLG)).toFixed(3); }
    };
} 