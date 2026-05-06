// ui.js - Handling Score, Fuel, Collisions, and Game Over

let score = 0;
window.gameFuel = 100; 
window.isGameOver = false;

const scoreDisplay = document.getElementById('score-display');
const fuelBar = document.getElementById('fuel-bar');
const gameOverScreen = document.getElementById('game-over-screen');
const gameOverTitle = document.getElementById('game-over-title');
const finalScoreText = document.getElementById('final-score-text');
const btnRestart = document.getElementById('btn-restart');
const bankDisplay = document.getElementById('bank-display');

bankDisplay.innerText = 'Bank: ' + getTotalCoins(); 

btnRestart.addEventListener('click', () => {
    location.reload(); 
});
btnRestart.addEventListener('touchstart', (e) => {
    e.preventDefault();
    location.reload(); 
});

function triggerGameOver(reason) {
    if (window.isGameOver) return; 
    
    window.isGameOver = true;
    
    const newTotalBank = saveCoins(score);
    
    gameOverTitle.innerText = reason; 
    finalScoreText.innerText = 'Run Coins: ' + score + '\nTotal Bank: ' + newTotalBank;
    gameOverScreen.style.display = 'flex'; 
}

Matter.Events.on(engine, 'beforeUpdate', () => {
    if (window.gameFuel > 0 && !window.isGameOver) {
        window.gameFuel -= 0.05; 
        fuelBar.style.width = window.gameFuel + '%';
        
        if (window.gameFuel < 25) {
            fuelBar.style.backgroundColor = '#ff0000';
        } else {
            fuelBar.style.backgroundColor = '#00ff00';
        }

        if (window.gameFuel <= 0) {
            triggerGameOver("OUT OF GAS!");
        }
    }
});

Matter.Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;

        if ((bodyA.label === 'head' && bodyB.label === 'ground') || 
            (bodyB.label === 'head' && bodyA.label === 'ground')) {
            triggerGameOver("CRASHED!");
        }

        if (bodyA.label === 'coin' || bodyB.label === 'coin') {
            const coin = bodyA.label === 'coin' ? bodyA : bodyB;
            Matter.Composite.remove(engine.world, coin);
            coin.label = 'collected';

            score += 10;
            scoreDisplay.innerText = 'Coins: ' + score;
        }

        if (bodyA.label === 'fuel' || bodyB.label === 'fuel') {
            const fuelCan = bodyA.label === 'fuel' ? bodyA : bodyB;
            Matter.Composite.remove(engine.world, fuelCan);
            fuelCan.label = 'collected';

            window.gameFuel += 40;
            if (window.gameFuel > 100) window.gameFuel = 100;
        }
    }
});
