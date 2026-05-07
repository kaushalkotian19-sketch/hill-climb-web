// terrain.js - Infinite Procedural Generation (Chunk Loading)

const Bodies = Matter.Bodies;
const Composite = Matter.Composite;

const segmentWidth = 40;     
const baseHeight = window.innerHeight - 100;

// This database keeps track of the dirt blocks that currently exist in the world
const activeSegments = {};

// --- THE 3-TIER WAVE MATH ---
function getWaveHeight(index) {
    if (index <= 20) return 0; // The flat starting runway
    
    const i = index - 20;
    
    // 1. MACRO: Massive rolling mountains
    const mountain = Math.sin(i * 0.015) * 300; 
    
    // 2. MID: Standard track hills
    const hill = Math.sin(i * 0.08) * 80; 
    
    // 3. MICRO: Jagged dirt bumps for the suspension
    const bump = Math.sin(i * 0.35) * 15; 
    
    // Combine all three layers!
    return mountain + hill + bump;
}

// --- WORLD BUILDER ---
// This function builds a single slice of terrain, plus any coins or fuel on it
function spawnSegment(index) {
    if (activeSegments[index]) return; // If we already built it, skip it

    const x1 = index * segmentWidth;
    const y1 = baseHeight + getWaveHeight(index);

    const x2 = (index + 1) * segmentWidth;
    const y2 = baseHeight + getWaveHeight(index + 1);

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const distance = Math.hypot(x2 - x1, y2 - y1); 
    const angle = Math.atan2(y2 - y1, x2 - x1);

    const parts = [];

    // The Dirt Block (with the +15 overlap hack)
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
            render: { 
                sprite: { texture: 'assets/coin.png', xScale: 0.04, yScale: 0.04 } 
            } 
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

    // Save this slice to our database and add it to the physics engine
    activeSegments[index] = parts;
    Composite.add(engine.world, parts);
}

// --- WORLD DESTROYER ---
// Deletes old slices to save memory
function removeSegment(index) {
    if (!activeSegments[index]) return;
    
    Composite.remove(engine.world, activeSegments[index]);
    delete activeSegments[index];
}

// --- THE INFINITE LOOP ---
// Every single frame, we check where the car is and build the world around it!
Matter.Events.on(engine, 'beforeUpdate', () => {
    if (!window.playerCar) return; // Don't build until the car spawns

    // Find out exactly which slice of the map the car is driving over right now
    const carX = window.playerCar.chassis.position.x;
    const currentIndex = Math.floor(carX / segmentWidth);

    // Render Distance: How far ahead and behind the car we want the world to exist
    const renderFront = 60; // Build 60 blocks ahead so you can't see the edge
    const renderBack = 20;  // Keep 20 blocks behind in case you roll backwards

    // 1. Build the new track in front of you
    for (let i = currentIndex - renderBack; i <= currentIndex + renderFront; i++) {
        if (i >= 0 && !activeSegments[i]) {
            spawnSegment(i);
        }
    }

    // 2. Delete the old track way behind you
    for (const indexStr in activeSegments) {
        const i = parseInt(indexStr);
        if (i < currentIndex - renderBack || i > currentIndex + renderFront + 5) {
            removeSegment(i);
        }
    }
});
