// terrain.js - Smooth Procedural Hill Generation

const Bodies = Matter.Bodies;
// We don't need to re-declare Composite since it's in main.js, but it's safe to use the global one

const terrainParts = [];

const segmentWidth = 40;     
const totalSegments = 300;   
const baseHeight = window.innerHeight - 100;

for (let i = 0; i < totalSegments; i++) {
    const x1 = i * segmentWidth;
    const y1 = baseHeight + Math.sin(i * 0.15) * 150;

    const x2 = (i + 1) * segmentWidth;
    const y2 = baseHeight + Math.sin((i + 1) * 0.15) * 150;

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
            render: { fillStyle: '#2e8b57' } 
        }
    );

    terrainParts.push(chunk);

    // Spawn Coins
    if (i % 10 === 0 && i > 5) {
        const coin = Bodies.circle(midX, midY - 40, 15, {
            isStatic: true, 
            isSensor: true, 
            label: 'coin', 
            render: { fillStyle: '#FFD700' } 
        });
        terrainParts.push(coin);
    }

    // Spawn Fuel Canisters
    if (i % 35 === 0 && i > 10) {
        const fuelCan = Bodies.rectangle(midX, midY - 50, 30, 40, {
            isStatic: true, 
            isSensor: true, 
            label: 'fuel', 
            render: { fillStyle: '#ff0000' } 
        });
        terrainParts.push(fuelCan);
    }
}

Matter.Composite.add(engine.world, terrainParts);
