// terrain.js - Advanced Multi-Tier Procedural Generation

const Bodies = Matter.Bodies;
const terrainParts = [];

const segmentWidth = 40;     
const totalSegments = 800; // Expanded track length for testing!
const baseHeight = window.innerHeight - 100;

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

for (let i = 0; i < totalSegments; i++) {
    const x1 = i * segmentWidth;
    const y1 = baseHeight + getWaveHeight(i);

    const x2 = (i + 1) * segmentWidth;
    const y2 = baseHeight + getWaveHeight(i + 1);

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const distance = Math.hypot(x2 - x1, y2 - y1); 
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // --- THE OVERLAP HACK ---
    // We make the width `distance + 15` instead of just `distance`.
    // This forces the blocks to overlap, sealing the invisible gaps!
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

    terrainParts.push(chunk);

    // Spawn Coins (Slightly higher above the bumps)
    if (i % 12 === 0 && i > 15) {
        const coin = Bodies.circle(midX, midY - 45, 15, {
            isStatic: true, isSensor: true, label: 'coin', 
            render: { 
                sprite: { texture: 'assets/coin.png', xScale: 0.04, yScale: 0.04 } 
            } 
        });
        terrainParts.push(coin);
    }

    // Spawn Fuel
    if (i % 40 === 0 && i > 25) {
        const fuelCan = Bodies.rectangle(midX, midY - 60, 30, 40, {
            isStatic: true, isSensor: true, label: 'fuel', 
            render: { fillStyle: '#ff0000' } 
        });
        terrainParts.push(fuelCan);
    }
}

Matter.Composite.add(engine.world, terrainParts);
