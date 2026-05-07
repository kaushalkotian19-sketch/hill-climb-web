// main.js - CORE ENGINE

const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const Events = Matter.Events;
const Composite = Matter.Composite;

// ==========================================
// ⚙️ ENGINE
// ==========================================
var engine = Engine.create();

var render = Render.create({
    element: document.body,
    engine: engine,

    options: {
        width: window.innerWidth,
        height: window.innerHeight,

        wireframes: false,

        background: '#87CEEB',

        hasBounds: true,

        pixelRatio: window.devicePixelRatio
    }
});

Render.run(render);

const runner = Runner.create();

Runner.run(runner, engine);

// ==========================================
// 🌍 GAME VARIABLES
// ==========================================
window.gameCoins = 0;

window.bankCoins =
    parseInt(localStorage.getItem('bankCoins')) || 0;

window.maxFuel = 100;

window.gameFuel = window.maxFuel;

window.isGameOver = false;

window.startX = 200;

window.keys = {
    gas: false,
    brake: false
};

// ==========================================
// 🚗 START GAME
// ==========================================
function startGame() {

    window.isGameOver = false;

    window.gameCoins = 0;

    window.gameFuel = window.maxFuel;

    document.getElementById(
        'gameOverScreen'
    ).style.display = 'none';

    document.getElementById(
        'bankDisplay'
    ).innerText = window.bankCoins;

    window.playerCar = new Vehicle(
        window.startX,
        window.innerHeight - 250,
        'jeep'
    );

    Matter.World.add(
        engine.world,
        window.playerCar.composite
    );
}

// ==========================================
// 💀 GAME OVER
// ==========================================
function triggerGameOver(reason) {

    if (window.isGameOver) return;

    window.isGameOver = true;

    window.bankCoins += window.gameCoins;

    localStorage.setItem(
        'bankCoins',
        window.bankCoins
    );

    document.getElementById(
        'crash-text'
    ).innerText =
        reason === 'fuel'
            ? 'OUT OF FUEL!'
            : 'CRASHED!';

    document.getElementById(
        'runCoinsDisplay'
    ).innerText = window.gameCoins;

    document.getElementById(
        'totalBankDisplay'
    ).innerText = window.bankCoins;

    document.getElementById(
        'gameOverScreen'
    ).style.display = 'block';
}

// ==========================================
// 🔄 GAME LOOP
// ==========================================
Events.on(engine, 'beforeUpdate', () => {

    if (!window.playerCar) return;

    if (window.isGameOver) return;

    // Camera
    Render.lookAt(render, {
        min: {
            x:
                window.playerCar.chassis.position.x -
                window.innerWidth / 2,

            y:
                window.playerCar.chassis.position.y -
                window.innerHeight / 2 + 100
        },

        max: {
            x:
                window.playerCar.chassis.position.x +
                window.innerWidth / 2,

            y:
                window.playerCar.chassis.position.y +
                window.innerHeight / 2 + 100
        }
    });

    // Distance
    const currentX =
        window.playerCar.chassis.position.x;

    let distanceMeters =
        Math.floor(
            (currentX - window.startX) / 50
        );

    if (distanceMeters < 0)
        distanceMeters = 0;

    document.getElementById(
        'distanceDisplay'
    ).innerText =
        distanceMeters + 'm';

    // Coins
    document.getElementById(
        'scoreDisplay'
    ).innerText = window.gameCoins;

    // Fuel drain
    if (window.keys.gas) {
        window.gameFuel -= 0.05;
    }

    window.gameFuel -= 0.01;

    if (window.gameFuel <= 0) {

        window.gameFuel = 0;

        triggerGameOver('fuel');
    }

    // Fuel UI
    const fuelPercentage =
        (window.gameFuel / window.maxFuel) * 100;

    const fuelFill =
        document.getElementById(
            'fuel-bar-fill'
        );

    fuelFill.style.width =
        fuelPercentage + '%';

    if (fuelPercentage < 20) {

        fuelFill.style.background =
            'linear-gradient(to bottom,#ff0000,#990000)';

    } else {

        fuelFill.style.background =
            'linear-gradient(to bottom,#4CAF50,#2E7D32)';
    }
});

// ==========================================
// 💥 COLLISIONS
// ==========================================
Events.on(engine, 'collisionStart', (event) => {

    event.pairs.forEach((pair) => {

        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // Crash
        if (
            (bodyA.label === 'head' &&
                bodyB.label === 'ground') ||

            (bodyB.label === 'head' &&
                bodyA.label === 'ground')
        ) {

            triggerGameOver('crash');
        }

        // Collect Items
        function collect(item) {

            // Coins
            if (item.label === 'coin') {

                window.gameCoins += 10;

                Composite.remove(
                    engine.world,
                    item
                );
            }

            // Fuel
            if (item.label === 'fuel') {

                window.gameFuel =
                    window.maxFuel;

                Composite.remove(
                    engine.world,
                    item
                );
            }
        }

        if (
            bodyA === window.playerCar.chassis ||
            bodyA === window.playerCar.wheelA ||
            bodyA === window.playerCar.wheelB
        ) {
            collect(bodyB);
        }

        if (
            bodyB === window.playerCar.chassis ||
            bodyB === window.playerCar.wheelA ||
            bodyB === window.playerCar.wheelB
        ) {
            collect(bodyA);
        }
    });
});

// ==========================================
// 🎮 CONTROLS
// ==========================================
window.onload = () => {

    const btnGas =
        document.getElementById('btn-gas');

    const btnBrake =
        document.getElementById('btn-brake');

    // GAS
    btnGas.addEventListener(
        'touchstart',
        (e) => {
            e.preventDefault();
            window.keys.gas = true;
        }
    );

    btnGas.addEventListener(
        'touchend',
        (e) => {
            e.preventDefault();
            window.keys.gas = false;
        }
    );

    btnGas.addEventListener(
        'mousedown',
        () => {
            window.keys.gas = true;
        }
    );

    btnGas.addEventListener(
        'mouseup',
        () => {
            window.keys.gas = false;
        }
    );

    // BRAKE
    btnBrake.addEventListener(
        'touchstart',
        (e) => {
            e.preventDefault();
            window.keys.brake = true;
        }
    );

    btnBrake.addEventListener(
        'touchend',
        (e) => {
            e.preventDefault();
            window.keys.brake = false;
        }
    );

    btnBrake.addEventListener(
        'mousedown',
        () => {
            window.keys.brake = true;
        }
    );

    btnBrake.addEventListener(
        'mouseup',
        () => {
            window.keys.brake = false;
        }
    );

    // Restart
    document
        .getElementById('btn-restart')
        .addEventListener('click', () => {

            location.reload();
        });

    startGame();
};
