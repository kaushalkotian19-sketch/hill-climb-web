// vehicle.js - The Bouncy Car Physics, Controls, and Camera

const Constraint = Matter.Constraint;
const VehicleRender = Matter.Render; 

const carGroup = Matter.Body.nextGroup(true);

const startX = 200; 
const startY = 100; 

// The Chassis
const chassis = Bodies.rectangle(startX, startY, 150, 30, { 
    collisionFilter: { group: carGroup },
    density: 0.002, 
    render: { fillStyle: '#ff0000' } 
});

// The Driver's Head and Neck
const head = Bodies.circle(startX, startY - 30, 15, {
    collisionFilter: { group: carGroup },
    density: 0.001,
    label: 'head', 
    render: { fillStyle: '#ffcc99' } 
});

const neck = Constraint.create({
    bodyA: chassis,
    pointA: { x: 0, y: -15 }, 
    bodyB: head,
    pointB: { x: 0, y: 0 },
    stiffness: 1, 
    length: 20,
    render: { visible: false } 
});

// The Wheels
const wheelOptions = {
    collisionFilter: { group: carGroup },
    friction: 0.8,    
    restitution: 0.1, 
    render: { fillStyle: '#333333' } 
};

const wheelA = Bodies.circle(startX - 50, startY + 20, 25, wheelOptions); 
const wheelB = Bodies.circle(startX + 50, startY + 20, 25, wheelOptions); 

// The Suspension
const axelA = Constraint.create({
    bodyA: chassis,
    pointA: { x: -50, y: 15 }, 
    bodyB: wheelA,
    stiffness: 0.15, 
    damping: 0.05,   
    length: 35,      
    render: { visible: true, strokeStyle: '#ffffff' } 
});

const axelB = Constraint.create({
    bodyA: chassis,
    pointA: { x: 50, y: 15 },
    bodyB: wheelB,
    stiffness: 0.15,
    damping: 0.05,
    length: 35,
    render: { visible: true, strokeStyle: '#ffffff' }
});

// Package it all together
const car = Matter.Composite.create({
    bodies: [chassis, wheelA, wheelB, head],
    constraints: [axelA, axelB, neck]
});

Matter.Composite.add(engine.world, car);

// Driving Controls
const keys = { gas: false, brake: false };

window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'd') keys.gas = true;
    if (event.key === 'ArrowLeft' || event.key === 'a') keys.brake = true;
});

window.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'd') keys.gas = false;
    if (event.key === 'ArrowLeft' || event.key === 'a') keys.brake = false;
});

const btnGas = document.getElementById('btn-gas');
const btnBrake = document.getElementById('btn-brake');

btnGas.addEventListener('touchstart', (e) => { e.preventDefault(); keys.gas = true; });
btnGas.addEventListener('touchend', (e) => { e.preventDefault(); keys.gas = false; });
btnGas.addEventListener('mousedown', (e) => { keys.gas = true; }); 
btnGas.addEventListener('mouseup', (e) => { keys.gas = false; });

btnBrake.addEventListener('touchstart', (e) => { e.preventDefault(); keys.brake = true; });
btnBrake.addEventListener('touchend', (e) => { e.preventDefault(); keys.brake = false; });
btnBrake.addEventListener('mousedown', (e) => { keys.brake = true; });
btnBrake.addEventListener('mouseup', (e) => { keys.brake = false; });

// Apply Engine Power and Camera Tracking
Matter.Events.on(engine, 'beforeUpdate', () => {
    const enginePower = 0.05; 

    if (window.gameFuel > 0 && !window.isGameOver) {
        if (keys.gas) {
            wheelA.torque = enginePower;
            wheelB.torque = enginePower;
        }
        
        if (keys.brake) {
            wheelA.torque = -enginePower;
            wheelB.torque = -enginePower;
        }
    }

    VehicleRender.lookAt(render, {
        min: { x: chassis.position.x - window.innerWidth / 2, y: chassis.position.y - window.innerHeight / 2 + 100 },
        max: { x: chassis.position.x + window.innerWidth / 2, y: chassis.position.y + window.innerHeight / 2 + 100 }
    });
});
