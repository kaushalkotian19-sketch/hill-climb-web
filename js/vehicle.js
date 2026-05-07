// vehicle.js - Reusable Vehicle Blueprint and Controls

const Constraint = Matter.Constraint;
const VehicleRender = Matter.Render; 

class Vehicle {
    constructor(startX, startY, vehicleType) {
        
        // --- 1. THE FINAL PHYSICS TUNE (HIGH HORSEPOWER) ---
        const stats = {
            jeep: {
                width: 160, height: 40, weight: 0.004, // Slightly lighter body
                wheelSize: 22, wheelGrip: 1.2, // Extra grip so the tires don't just spin in the dirt        
                suspensionStiffness: 0.5, suspensionDamping: 0.05, // Softened for better bounce
                power: 4.0, // MASSIVE HORSEPOWER BOOST (was 0.4)
                imageScale: 0.14, 
                wheelScale: 0.045
            },
            monster_truck: {
                width: 190, height: 50, weight: 0.006, 
                wheelSize: 35, wheelGrip: 1.5,         
                suspensionStiffness: 0.6, suspensionDamping: 0.08, 
                power: 8.0, // Monster torque for the monster truck
                imageScale: 0.18, 
                wheelScale: 0.06
            }
        };
        
        this.config = stats[vehicleType] || stats.jeep;
        this.enginePower = this.config.power;

        const carGroup = Matter.Body.nextGroup(true);

        // --- 2. THE CHASSIS ---
        this.chassis = Matter.Bodies.rectangle(startX, startY, this.config.width, this.config.height, { 
            collisionFilter: { group: carGroup }, 
            density: this.config.weight, 
            chamfer: { radius: 20 }, 
            render: { 
                sprite: { 
                    texture: 'assets/chassis.png', 
                    xScale: this.config.imageScale, 
                    yScale: this.config.imageScale 
                } 
            } 
        });

        // The Driver's Head 
        this.head = Matter.Bodies.circle(startX, startY - 40, 10, {
            collisionFilter: { group: carGroup }, 
            density: 0.001, label: 'head', render: { fillStyle: 'transparent' } 
        });

        const neck = Constraint.create({
            bodyA: this.chassis, pointA: { x: 0, y: -this.config.height / 2 }, 
            bodyB: this.head, pointB: { x: 0, y: 0 }, stiffness: 1, length: 25, render: { visible: false } 
        });

        // --- 3. THE WHEELS (LIGHTWEIGHT FOR INSTANT SPIN) ---
        const wheelOptions = {
            collisionFilter: { group: carGroup }, 
            friction: this.config.wheelGrip, 
            density: 0.001, // Super light tires so the engine can spin them easily
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
        const wheelOffsetY = 60; 

        this.wheelA = Matter.Bodies.circle(startX - wheelOffsetX, startY + wheelOffsetY, this.config.wheelSize, wheelOptions); 
        this.wheelB = Matter.Bodies.circle(startX + wheelOffsetX, startY + wheelOffsetY, this.config.wheelSize, wheelOptions); 

        // --- 4. EXTENDED ANCHOR SUSPENSION ---
        const axelA = Constraint.create({
            bodyA: this.chassis, 
            pointA: { x: -wheelOffsetX, y: wheelOffsetY }, 
            bodyB: this.wheelA, 
            stiffness: this.config.suspensionStiffness, 
            damping: this.config.suspensionDamping,   
            length: 0, 
            render: { visible: false } 
        });

        const axelB = Constraint.create({
            bodyA: this.chassis, 
            pointA: { x: wheelOffsetX, y: wheelOffsetY }, 
            bodyB: this.wheelB, 
            stiffness: this.config.suspensionStiffness, 
            damping: this.config.suspensionDamping,
            length: 0, 
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

// ... (Keep your controls and Matter.Events exactly the same below this) ...
