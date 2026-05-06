// main.js - The Core Game Loop

const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Composite = Matter.Composite;

const engine = Engine.create();

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

Render.run(render);

const runner = Runner.create();
Runner.run(runner, engine);

window.addEventListener('resize', () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
});
