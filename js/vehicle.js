// vehicle.js - Reusable Vehicle Blueprint and Controls

const Constraint = Matter.Constraint;
const VehicleRender = Matter.Render; 

class Vehicle {
    constructor(startX, startY, vehicleType) {
        
        // --- 1. PERFECTED GAME PHYSICS ---
        const stats = {
            jeep: {
                width: 160, height: 30, weight: 0.002, 
                wheelSize: 22, wheelGrip: 0.9,         
                suspensionStiffness: 0.2, suspensionDamping: 0.05, // Soft bouncy shocks
                power: 0.15, // Stronger engine to climb hills easily
                imageScale: 0.14, 
                wheelScale: 0.045
            },
            monster_truck: {
                width: 190, height: 40, weight: 0.004, 
                wheelSize: 35, wheelGrip: 1.2,         
                suspensionStiffness: 0.3, suspensionDamping: 0.08, 
                power: 0.25,
                imageScale: 0.18, 
                wheelScale: 0.06
            }
        };
        
        this.config = stats[vehicleType] || stats.jeep;
        this.enginePower = this.config.power;

        const carGroup = Matter.Body.nextGroup(true);

        // --- 2. THE CHASSIS (WITH SLED CORNERS) ---
        this.chassis = Matter.Bodies.rectangle(startX, startY, this.config.width, this.config.height, { 
            collisionFilter: { group: carGroup }, 
            density: this.config.weight, 
            chamfer: { radius: 15 }, // HIGHLY ROUNDED CORNERS - Slides right over dirt!
            render: { 
                sprite: { 
                    texture: 'assets/chassis.png', 
                    xScale: this.config.imageScale, 
                    yScale: this.config.imageScale 
                } 
            } 
        });

        // The Driver's Head 
        this.head = Matter.Bodies.circle(startX, startY - 35, 12, {
            collisionFilter: { group: carGroup }, 
            density: 0.001, label: 'head', render: { fillStyle: 'transparent' } 
        });

        const neck = Constraint.create({
            bodyA: this.chassis, pointA: { x: 0, y: -this.config.height / 2 }, 
            bodyB: this.head, pointB: { x: 0, y: 0 }, stiffness: 1, length: 20, render: { visible: false } 
        });

        // --- 3. WHEEL PLACEMENT ---
        const wheelOptions = {
            collisionFilter: { group: carGroup }, 
            friction: this.config.wheelGrip, 
            density: 0.02, // Heavy tires keep the car upright
            restitution: 0.1, 
            render: { 
                sprite: { 
                    texture: 'assets/wheel.png', 
                    xScale: this.config.wheelScale, 
                    yScale: this.config.wheelScale 
                } 
            }  
        };

        const wheelOffsetX = 60; 
        const wheelOffsetY = 35; // This drops the wheels perfectly below the car

        this.wheelA = Matter.Bodies.circle(startX - wheelOffsetX, startY + wheelOffsetY, this.config.wheelSize, wheelOptions); 
        this.wheelB = Matter.Bodies.circle(startX + wheelOffsetX, startY + wheelOffsetY, this.config.wheelSize, wheelOptions); 

        // --- 4. ZERO-LENGTH SUSPENSION (THE MAGIC FIX) ---
        // By setting length to 0, the wheel CANNOT swing forward/backward. 
        // It must bounce strictly on the anchor point.
        const axelA = Constraint.create({
            bodyA: this.chassis, 
            pointA: { x: -wheelOffsetX, y: wheelOffsetY }, // Anchored far below the car
            bodyB: this.wheelA, 
            stiffness: this.config.suspensionStiffness, 
            damping: this.config.suspensionDamping,   
            length: 0, // NO PENDULUM EFFECT
            render: { visible: false } 
        });

        const axelB = Constraint.create({
            bodyA: this.chassis, 
            pointA: { x: wheelOffsetX, y: wheelOffsetY }, // Anchored far below the car
            bodyB: this.wheelB, 
            stiffness: this.config.suspensionStiffness, 
            damping: this.config.suspensionDamping,
            length: 0, // NO PENDULUM EFFECT
            render: { visible: false } 
        });

        this.composite = Matter.Composite.create({
            bodies: [this.chassis, this.wheelA, this.wheelB, this.head],
            constraints: [axelA, axelB, neck]
        });
    }

    drive(keys) {
        if (keys.gas) { this.wheelA.torque = this.enginePower; this.wheelB.torque = this.enginePower; }
        if (keys.brake) { this.wheelA.torque = -this.enginePower; this.wheelB.torque = -this.enginePower; }
    }
}

// ... (Keep all your existing button listeners and engine code below this!) ...
