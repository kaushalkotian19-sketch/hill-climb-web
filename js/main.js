// main.js - Core Game Engine and Logic

const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Events = Matter.Events,
      Composite = Matter.Composite;

// Initialize Physics Engine
const engine = Engine.create();
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent' // Transparent so parallax sky shows through
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// Global Game Variables
window.gameCoins = 0;
window.bankCoins = parseInt(localStorage.getItem('bankCoins')) || 0;
window.maxFuel = 100;
window.gameFuel = window.maxFuel;
window.isGameOver = false;
window.startX = 200; // Starting position for distance tracking

// Start the game
function startGame() {
    window.isGameOver = false;
    window.gameCoins = 0;
    window.gameFuel = window.maxFuel;
    document.getElementById('gameOverScreen').style.display = 'none';

    // Update initial UI
    document.getElementById('bankDisplay').innerText = window.bankCoins;
    
    // Spawn Player
    window.playerCar = new Vehicle(window.startX, window.innerHeight - 150, 'jeep');
}

// Game Over Logic
function triggerGameOver(reason) {
    if (window.isGameOver) return;
    window.isGameOver = true;
    
    window.bankCoins += window.gameCoins;
    localStorage.setItem('bankCoins', window.bankCoins);
    
    document.getElementById('crash-text').innerText = reason === 'fuel' ? 'OUT OF FUEL!' : 'CRASHED!';
    document.getElementById('runCoinsDisplay').innerText = window.gameCoins;
    document.getElementById('totalBankDisplay').innerText = window.bankCoins;
    document.getElementById('gameOverScreen').style.display = 'block';
}

// Restart Logic
document.getElementById('btn-restart').addEventListener('click', () => {
    Composite.clear(engine.world);
    Engine.clear(engine);
    startGame();
});

// Update Loop (Runs every frame)
Events.on(engine, 'beforeUpdate', () => {
    if (!window.playerCar || window.isGameOver) return;

    // 1. Calculate Distance
    const currentX = window.playerCar.chassis.position.x;
    let distanceMeters = Math.floor((currentX - window.startX) / 50);
    if (distanceMeters < 0) distanceMeters = 0;
    
    // 2. Update UI Text
    document.getElementById('distanceDisplay').innerText = distanceMeters + 'm';
    document.getElementById('scoreDisplay').innerText = window.gameCoins;
    
    // 3. Update Fuel
    if (keys.gas) {
        window.gameFuel -= 0.05; // Deplete fuel while driving
    }
    window.gameFuel -= 0.01; // Constant slow drain
    
    if (window.gameFuel <= 0) {
        window.gameFuel = 0;
        triggerGameOver('fuel');
    }

    const fuelPercentage = (window.gameFuel / window.maxFuel) * 100;
    const fuelFill = document.getElementById('fuel-bar-fill');
    fuelFill.style.width = fuelPercentage + '%';
    
    if (fuelPercentage < 20) {
        fuelFill.style.background = 'linear-gradient(to bottom, #FF3D00, #DD2C00)';
    } else {
        fuelFill.style.background = 'linear-gradient(to bottom, #4CAF50, #2E7D32)';
    }
});

// Collision Logic (Coins, Fuel, and Crashing)
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // Check Head Crash
        if ((bodyA.label === 'head' && bodyB.label === 'ground') || 
            (bodyB.label === 'head' && bodyA.label === 'ground')) {
            triggerGameOver('crash');
        }

        // Collect Items Function
        function collect(item) {
            if (item.label === 'coin') {
                window.gameCoins += 10;
                Composite.remove(engine.world, item);
            }
            if (item.label === 'fuel') {
                window.gameFuel = window.maxFuel;
                Composite.remove(engine.world, item);
            }
        }

        // Check if car touches items
        if (bodyA === window.playerCar.chassis || bodyA === window.playerCar.wheelA || bodyA === window.playerCar.wheelB) collect(bodyB);
        if (bodyB === window.playerCar.chassis || bodyB === window.playerCar.wheelA || bodyB === window.playerCar.wheelB) collect(bodyA);
    });
});

// Boot the game
startGame();
