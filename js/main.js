// main.js - Core Engine & Logic

const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Events = Matter.Events,
      Composite = Matter.Composite;

// 'var' is required here so terrain.js can see the engine!
var engine = Engine.create();
var render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent' 
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

window.gameCoins = 0;
window.bankCoins = parseInt(localStorage.getItem('bankCoins')) || 0;
window.maxFuel = 100;
window.gameFuel = window.maxFuel;
window.isGameOver = false;
window.startX = 200; 

function startGame() {
    window.isGameOver = false;
    window.gameCoins = 0;
    window.gameFuel = window.maxFuel;
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('bankDisplay').innerText = window.bankCoins;
    
    // Spawn the physical car
    window.playerCar = new Vehicle(window.startX, window.innerHeight - 150, 'jeep');
    Matter.World.add(engine.world, window.playerCar.composite); // <-- THIS FIXES THE INVISIBLE CAR!
}

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

document.getElementById('btn-restart').addEventListener('click', () => {
    Composite.clear(engine.world);
    Engine.clear(engine);
    
    // Wipe old track and pre-build the new starting line
    if (typeof activeSegments !== 'undefined') {
        for (const indexStr in activeSegments) { delete activeSegments[indexStr]; }
        for (let i = 0; i < 100; i++) { if (typeof spawnSegment === 'function') spawnSegment(i); }
    }
    startGame();
});

Events.on(engine, 'beforeUpdate', () => {
    if (!window.playerCar || window.isGameOver) return;

    // CAMERA LOCK (Tracks the car!)
    Render.lookAt(render, {
        min: { x: window.playerCar.chassis.position.x - window.innerWidth / 2, y: window.playerCar.chassis.position.y - window.innerHeight / 2 + 100 },
        max: { x: window.playerCar.chassis.position.x + window.innerWidth / 2, y: window.playerCar.chassis.position.y + window.innerHeight / 2 + 100 }
    });

    const currentX = window.playerCar.chassis.position.x;
    let distanceMeters = Math.floor((currentX - window.startX) / 50);
    if (distanceMeters < 0) distanceMeters = 0;
    
    document.getElementById('distanceDisplay').innerText = distanceMeters + 'm';
    document.getElementById('scoreDisplay').innerText = window.gameCoins;
    
    if (typeof keys !== 'undefined' && keys.gas) window.gameFuel -= 0.05; 
    window.gameFuel -= 0.01; 
    
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

Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        if ((bodyA.label === 'head' && bodyB.label === 'ground') || (bodyB.label === 'head' && bodyA.label === 'ground')) {
            triggerGameOver('crash');
        }

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

        if (bodyA === window.playerCar.chassis || bodyA === window.playerCar.wheelA || bodyA === window.playerCar.wheelB) collect(bodyB);
        if (bodyB === window.playerCar.chassis || bodyB === window.playerCar.wheelA || bodyB === window.playerCar.wheelB) collect(bodyA);
    });
});

// WAITS FOR ALL FILES TO DOWNLOAD BEFORE STARTING!
window.onload = () => { startGame(); };
