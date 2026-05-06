// terrain.js - Smooth Procedural Hill Generation with a Flat Start

const Bodies = Matter.Bodies;
const terrainParts = [];

const segmentWidth = 40;     
const totalSegments = 300;   
const baseHeight = window.innerHeight - 100;

for (let i = 0; i < totalSegments; i++) {
    
    let waveHeight1 = 0;
    let waveHeight2 = 0;
    
    // Flat runway for 15 segments, then bumpy mountains
    if (i > 15) {
        const step1 = i - 15;
        const step2 = (i + 1) - 15;
        waveHeight1 = (Math.sin(step1 * 0.06) * 80) + (Math.sin(step1 * 0.015) * 250); 
        waveHeight2 = (Math.sin(step2 * 0.06) * 80) + (Math.sin(step2 * 0.015) * 250);
    }

    const x1 = i * segmentWidth;
    const y1 = baseHeight + waveHeight1;

    const x2 = (i + 1) * segmentWidth;
    const y2 = baseHeight + waveHeight2;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const distance = Math.hypot(x2 - x1, y2 - y1); 
    const angle = Math.atan2(y2 - y1, x2 - x1);

    const chunk = Bodies.rectangle(
        midX, midY + 200, distance + 2, 400,
        { 
            isStatic: true, 
            angle: angle, 
            friction: 0.9, 
            label: 'ground', 
            render: { fillStyle: '#5C4033' } // Dirt Brown
        }
    );

    terrainParts.push(chunk);

    // Spawn Coins
    if (i % 10 === 0 && i > 5) {
        const coin = Bodies.circle(midX, midY - 40, 15, {
            isStatic: true, isSensor: true, label: 'coin', 
            render: { 
                sprite: { texture: 'assets/coin.png', xScale: 0.04, yScale: 0.04 } 
            } 
        });
        terrainParts.push(coin);
    }

    // Spawn Fuel
    if (i % 35 === 0 && i > 10) {
        const fuelCan = Bodies.rectangle(midX, midY - 50, 30, 40, {
            isStatic: true, isSensor: true, label: 'fuel', 
            render: { fillStyle: '#ff0000' } 
        });
        terrainParts.push(fuelCan);
    }
}

Matter.Composite.add(engine.world, terrainParts);
