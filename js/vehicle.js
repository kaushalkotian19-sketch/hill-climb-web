// vehicle.js - The Bouncy Car Physics

// Pull in the Constraint module for our suspension springs
const Constraint = Matter.Constraint;

// 1. Create a Collision Group
// This is critical. It tells the engine that the wheels and chassis belong 
// to the same object, so they don't violently collide with each other.
const carGroup = Matter.Body.nextGroup(true);

// 2. Set the starting drop position (Top center of the screen)
const startX = window.innerWidth / 2;
const startY = 100; 

// 3. The Chassis (Car Body)
const chassis = Bodies.rectangle(startX, startY, 150, 30, { 
    collisionFilter: { group: carGroup },
    density: 0.002, // Gives the car some weight so it pushes down on the springs
    render: { fillStyle: '#ff0000' } // Classic red
});

// 4. The Wheels
const wheelOptions = {
    collisionFilter: { group: carGroup },
    friction: 0.8,    // High friction so the tires grip the terrain
    restitution: 0.1, // A tiny bit of natural tire bounce
    render: { fillStyle: '#333333' } // Dark grey tires
};

const wheelA = Bodies.circle(startX - 50, startY + 20, 25, wheelOptions); // Back wheel
const wheelB = Bodies.circle(startX + 50, startY + 20, 25, wheelOptions); // Front wheel

// 5. The Suspension (The Magic Part)
// Constraints act as springs. We attach them from the chassis to the center of the wheels.
const axelA = Constraint.create({
    bodyA: chassis,
    pointA: { x: -50, y: 15 }, // Attachment point on the chassis
    bodyB: wheelA,
    stiffness: 0.15, // The spring tension. Lower = softer, bouncier suspension
    damping: 0.05,   // Shock absorbers. This stops the car from bouncing infinitely
    length: 35,      // The resting length of the suspension
    render: { visible: true, strokeStyle: '#ffffff' } // Draw a white line for the spring
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
// We bundle the parts into a single "Composite" so the engine treats it as one vehicle
const car = Composite.create({
    bodies: [chassis, wheelA, wheelB],
    constraints: [axelA, axelB]
});

// 7. Add the finished car to the world
Composite.add(engine.world, car);
