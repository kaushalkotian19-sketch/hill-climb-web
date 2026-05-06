// main.js - The Core Game Loop

// 1. Create aliases for Matter.js modules so we don't have to type "Matter." every time
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Composite = Matter.Composite;

// 2. Create the physics engine (The Brain)
const engine = Engine.create();

// 3. Create the renderer (The Eyes)
const render = Render.create({
    element: document.getElementById('game-container'),
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false, // Set to true later if we need to debug the collision boxes
        background: 'transparent'
    }
});

// 4. Run the renderer
Render.run(render);

// 5. Create and run the runner (The Heartbeat that updates physics frame-by-frame)
const runner = Runner.create();
Runner.run(runner, engine);

// 6. Make it mobile-friendly: Resize the canvas if the device orientation changes
window.addEventListener('resize', () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
});
