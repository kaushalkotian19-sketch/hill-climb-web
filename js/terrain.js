// terrain.js - Procedural Hill Generation

const Bodies = Matter.Bodies;

// We will store all the tiny ground pieces in this array
const terrainParts = [];

const segmentWidth = 40;     // How wide each chunk of ground is
const totalSegments = 300;   // How long the track is
const baseHeight = window.innerHeight - 100;

// Loop to create hundreds of connected rectangles
for (let i = 0; i < totalSegments; i++) {
    const xPos = i * segmentWidth;
    
    // THE MAGIC MATH
    const waveHeight = Math.sin(i * 0.15) * 150; 
    const yPos = baseHeight + waveHeight;

    // Create a tall, static rectangle for this segment
    const chunk = Bodies.rectangle(xPos, yPos + 300, segmentWidth + 2, 600, { 
        isStatic: true, 
        friction: 0.9, 
        render: { fillStyle: '#2e8b57' } // Grassy green
    });

    terrainParts.push(chunk);
}

// Add all the terrain chunks into the world at once
Composite.add(engine.world, terrainParts);
