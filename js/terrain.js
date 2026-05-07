// terrain.js - Bulletproof Infinite Generation

const Bodies = Matter.Bodies;
const World = Matter.World;

const segmentWidth = 40;     
const baseHeight = window.innerHeight - 100;

const activeSegments = {};
let lastCarX = null; // Used to detect when you click "Try Again"

// --- THE 3-TIER WAVE MATH ---
function getWaveHeight(index) {
    if (index <= 20) return 0; // The flat starting runway
    
    const i = index - 20;
    
    const mountain = Math.sin(i * 0.015) * 300; 
    const hill = Math.sin(i * 0.08) * 80; 
    const bump = Math.sin(i * 0.35) * 15; 
    
    return mountain + hill + bump;
}

// --- WORLD BUILDER ---
function spawnSegment(index) {
    if (activeSegments[index]) return; 

    const x1 = index * segmentWidth;
    const y1 = baseHeight + getWaveHeight(index);
    const x2 = (index + 1) * segmentWidth;
    const y2 = baseHeight + getWaveHeight(index + 1);

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const distance = Math.hypot(x2 - x1, y2 - y1); 
    const angle = Math.atan2(y2 - y1, x2 - x1);

    const parts = [];

    // The Dirt Block
    const chunk = Bodies.rectangle(
        midX, midY + 200, distance + 15, 400,
        { 
            isStatic: true, 
            angle: angle, 
            friction: 0.9, 
            label: 'ground', 
            render: { fillStyle: '#5C4033' } 
        }
    );
    parts.push(chunk);

    // Spawn Coins
    if (index % 12 === 0 && index > 15) {
        const coin = Bodies.circle(midX, midY - 45, 15, {
            isStatic: true, isSensor: true, label: 'coin', 
            render: { sprite: { texture: 'assets/coin.png', xScale: 0.04, yScale: 0.04 } } 
        });
        parts.push(coin);
    }

    // Spawn Fuel
    if (index % 40 === 0 && index > 25) {
        const fuelCan = Bodies.rectangle(midX, midY - 60, 30, 40, {
            isStatic: true, isSensor: true, label: 'fuel', 
            render: { fillStyle: '#ff0000' } 
        });
        parts.push(fuelCan);
    }

    // Log it into our database
    activeSegments[index] = parts;
    
    // Safely add each piece to the world
    for (let j = 0; j < parts.length; j++) {
        World.add(engine.world, parts[j]);
    }
}

// --- WORLD DESTROYER ---
function removeSegment(index) {
    if (!activeSegments[index]) return;
    
    const parts = activeSegments[index];
    
    // Safely remove each piece from the world
    for (let j = 0; j < parts.length; j++) {
        World.remove(engine.world, parts[j]);
    }
    
    delete activeSegments[index];
}

// --- THE INFINITE LOOP ---
Matter.Events.on(engine, 'beforeUpdate', () => {
    if (!window.playerCar) return; 

    const carX = window.playerCar.chassis.position.x;
    
    // ==========================================
    // 🚨 RESTART DETECTOR 🚨
    // If the car suddenly teleports backwards to the start line, 
    // we know you clicked "Try Again". We clear our memory to rebuild!
    // ==========================================
    if (lastCarX !== null && carX < lastCarX - 500) {
        for (const indexStr in activeSegments) {
            delete activeSegments[indexStr]; 
        }
    }
    lastCarX = carX;

    const currentIndex = Math.floor(carX / segmentWidth);

    const renderFront = 60; 
    const renderBack = 20;  

    // 1. Build the new track in front of you
    for (let i = currentIndex - renderBack; i <= currentIndex + renderFront; i++) {
        if (i >= 0 && !activeSegments[i]) {
            spawnSegment(i);
        }
    }

    // 2. Delete the old track way behind you to save phone battery
    for (const indexStr in activeSegments) {
        const i = parseInt(indexStr);
        if (i < currentIndex - renderBack || i > currentIndex + renderFront + 5) {
            removeSegment(i);
        }
    }
});
