// vehicle.js - Reusable Vehicle Blueprint and Controls

const Constraint = Matter.Constraint;
const VehicleRender = Matter.Render; 

class Vehicle {
    constructor(startX, startY, vehicleType) {
        
        // --- 1. BALANCED ARCADE PHYSICS ---
        const stats = {
            jeep: {
                width: 160, height: 30, weight: 0.002, 
                wheelSize: 22, wheelGrip: 0.8, // Slightly lowered grip so it doesn't get stuck on walls
                suspensionStiffness: 0.15, suspensionDamping: 0.05, // Perfect bouncy shocks!
                power: 0.15, // High horsepower to spin the wheels instantly
                imageScale: 0.14, 
                wheelScale: 0.045
            },
            monster_truck: {
                width: 190, height: 40, weight: 0.004, 
                wheelSize: 35, wheelGrip: 1.0,         
                suspensionStiffness: 0.2, suspensionDamping: 0.08, 
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
            chamfer: { radius: 15 }, // Slides over the dirt smoothly
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

        // --- 3. LIGHTWEIGHT WHEELS ---
        const wheelOptions = {
            collisionFilter: { group: carGroup }, 
            friction: this.config.wheelGrip, 
            density: 0.002, // FIXED: Changed back to lightweight rubber!
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

        // We create the wheels a bit lower so the springs have room to connect
        this.wheelA = Matter.Bodies.circle(startX - wheelOffsetX, startY + 30, this.config.wheelSize, wheelOptions); 
        this.wheelB = Matter.Bodies.circle(startX + wheelOffsetX, startY + 30, this.config.wheelSize, wheelOptions); 

        // --- 4. SHORT-TRAVEL SUSPENSION ---
        // Anchored inside the wheel well, with exactly 15 pixels of bounce travel
        const axelA = Constraint.create({
            bodyA: this.chassis, 
            pointA: { x: -wheelOffsetX, y: 15 }, // Anchor point on the car
            bodyB: this.wheelA, 
            stiffness: this.config.suspensionStiffness, 
            damping: this.config.suspensionDamping,   
            length: 15, // FIXED: Gives just enough room for a satisfying bounce!
            render: { visible: false } 
        });

        const axelB = Constraint.create({
            bodyA: this.chassis, 
            pointA: { x: wheelOffsetX, y: 15 }, // Anchor point on the car
            bodyB: this.wheelB, 
            stiffness: this.config.suspensionStiffness, 
            damping: this.config.suspensionDamping,
            length: 15, // FIXED
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

// ... (Keep your controls and Matter.Events below this) ...
