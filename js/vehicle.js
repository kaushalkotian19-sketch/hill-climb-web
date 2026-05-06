// vehicle.js - The Bouncy Car Physics, Controls, and Camera

const Constraint = Matter.Constraint;
// Add Render reference here for the camera to use later
const VehicleRender = Matter.Render; 

// 1. Create a Collision Group
const carGroup = Matter.Body.nextGroup(true);

// 2. Set the starting drop position
const startX = 200; // Moved slightly left so you can see it drop onto the first hill
const startY = 100; 

// 3. The Chassis
const chassis = Bodies.rectangle(startX, startY, 150, 30, { 
    collisionFilter: { group: carGroup },
    density: 0.002, 
    render: { fillStyle: '#ff0000' } 
});

// 4. The Wheels
const wheelOptions = {
    collisionFilter: { group: carGroup },
    friction: 0.8,    
    restitution: 0.1, 
    render: { fillStyle: '#333333' } 
};

const wheelA = Bodies.circle(startX - 50, startY + 20, 25, wheelOptions); // Back wheel
const wheelB = Bodies.circle(startX + 50, startY + 20, 25, wheelOptions); // Front wheel

// 5. The Suspension
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

// 6. Package it all together
const car = Composite.create({
    bodies: [chassis, wheelA, wheelB],
    constraints: [axelA, axelB]
});

// 7. Add the finished car to the world
Composite.add(engine.world, car);

// 8. Driving Controls
const keys = { gas: false, brake: false };

window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'd') keys.gas = true;
    if (event.key === 'ArrowLeft' || event.key === 'a') keys.brake = true;
});

window.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'd') keys.gas = false;
    if (event.key === 'ArrowLeft' || event.key === 'a') keys.brake = false;
});

// 9. Apply Engine Power and Camera Tracking
Matter.Events.on(engine, 'beforeUpdate', () => {
    const enginePower = 0.05; 

    if (keys.gas) {
        wheelA.torque = enginePower;
        wheelB.torque = enginePower;
    }
    
    if (keys.brake) {
        wheelA.torque = -enginePower;
        wheelB.torque = -enginePower;
    }

    // 10. Camera Tracking
    VehicleRender.lookAt(render, {
        min: { x: chassis.position.x - window.innerWidth / 2, y: chassis.position.y - window.innerHeight / 2 + 100 },
        max: { x: chassis.position.x + window.innerWidth / 2, y: chassis.position.y + window.innerHeight / 2 + 100 }
    });
});
