// terrain.js - The Ground Logic

const Bodies = Matter.Bodies;

// Create a flat ground rectangle
// Parameters: x-coordinate, y-coordinate, width, height
const ground = Bodies.rectangle(
    window.innerWidth / 2,           // Center it horizontally
    window.innerHeight - 50,         // Place it near the bottom of the screen
    window.innerWidth,               // Make it as wide as the screen
    100,                             // 100 pixels thick
    { 
        isStatic: true,              // CRITICAL: This stops the ground from falling down due to gravity!
        render: { fillStyle: '#2e8b57' } // Give it a nice grassy green color
    } 
);

// Add the ground to our physics world so the engine knows it exists
Composite.add(engine.world, [ground]);
