// main.js - The Core Game Loop

// 1. Create aliases for Matter.js modules
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
        wireframes: false, 
        background: 'transparent'
    }
});

// 4. Run the renderer
Render.run(render);

// 5. Create and run the runner 
const runner = Runner.create();
Runner.run(runner, engine);

// 6. Make it mobile-friendly: Resize the canvas on orientation change
window.addEventListener('resize', () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
});
