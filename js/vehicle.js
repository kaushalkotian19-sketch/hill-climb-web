// vehicle.js - Reusable Vehicle Blueprint and Controls

const Constraint = Matter.Constraint;
const VehicleRender = Matter.Render; 

// 1. THE BLUEPRINT (JavaScript Class)
class Vehicle {
    constructor(startX, startY, vehicleType) {
        
        // --- THE GARAGE (Vehicle Stats Database) ---
        const stats = {
            jeep: {
                width: 150, height: 30, weight: 0.002, 
                wheelSize: 25, wheelGrip: 1.0,         
                suspensionStiffness: 0.15, suspensionDamping: 0.05,
                power: 0.08,                           
                color: '#ff0000'
            },
            monster_truck: {
                width: 200, height: 40, weight: 0.005, 
                wheelSize: 45, wheelGrip: 1.2,         
                suspensionStiffness: 0.2, suspensionDamping: 0.1, 
                power: 0.15,                           
                color: '#0000ff'
            }
        };
        
        this.config = stats[vehicleType] || stats.jeep;
        this.enginePower = this.config.power;

        // --- BUILD THE PHYSICAL PARTS ---
        const carGroup = Matter.Body.nextGroup(true);

        // The Chassis (Graphical)
        this.chassis = Matter.Bodies.rectangle(startX, startY, this.config.width, this.config.height, { 
            collisionFilter: { group: carGroup },
            density: this.config.weight, 
            render: { 
                sprite: {
                    texture: 'assets/chassis.png',
                    xScale: 0.15, // Scaled down for high-res images
                    yScale: 0.15
                } 
            } 
        });

        // The Driver's Head & Neck (Invisible hitbox for crashes)
        this.head = Matter.Bodies.circle(startX, startY - 30, 15, {
            collisionFilter: { group: carGroup },
            density: 0.001,
            label: 'head', 
            render: { fillStyle: 'transparent' } // Hidden so it doesn't block your chassis graphic
        });

        const neck = Constraint.create({
            bodyA: this.chassis,
            pointA: { x: 0, y: -this.config.height / 2 }, 
            bodyB: this.head,
            pointB: { x: 0, y: 0 },
            stiffness: 1, 
            length: 20,
            render: { visible: false } 
        });

        // The Wheels (Graphical)
        const wheelOptions = {
            collisionFilter: { group: carGroup },
            friction: this.config.wheelGrip,    
            restitution: 0.1, 
            render: { 
                sprite: {
                    texture: 'assets/wheel.png',
                    xScale: 0.12, // Scaled down for high-res images
                    yScale: 0.12
                } 
            }  
        };

        const wheelOffset = this.config.width / 2 - 25; 
        
        this.wheelA = Matter.Bodies.circle(startX - wheelOffset, startY + 20, this.config.wheelSize, wheelOptions); 
        this.wheelB = Matter.Bodies.circle(startX + wheelOffset, startY + 20, this.config.wheelSize, wheelOptions); 

        // The Suspension
        const axelA = Constraint.create({
            bodyA: this.chassis,
            pointA: { x: -wheelOffset, y: this.config.height / 2 }, 
            bodyB: this.wheelA,
            stiffness: this.config.suspensionStiffness, 
            damping: this.config.suspensionDamping,   
            length: this.config.wheelSize + 10,      
            render: { visible: false } // Hidden so we don't see white lines over the graphics
        });

        const axelB = Constraint.create({
            bodyA: this.chassis,
            pointA: { x: wheelOffset, y: this.config.height / 2 },
            bodyB: this.wheelB,
            stiffness: this.config.suspensionStiffness,
            damping: this.config.suspensionDamping,
            length: this.config.wheelSize + 10,
            render: { visible: false } // Hidden
        });

        this.composite = Matter.Composite.create({
            bodies: [this.chassis, this.wheelA, this.wheelB, this.head],
            constraints: [axelA, axelB, neck]
        });
    }

    drive(keys) {
        if (keys.gas) {
            this.wheelA.torque = this.enginePower;
            this.wheelB.torque = this.enginePower;
        }
        if (keys.brake) {
            this.wheelA.torque = -this.enginePower;
            this.wheelB.torque = -this.enginePower;
        }
    }
}

// ==========================================
// 2. SPAWN THE PLAYER
// ==========================================

const playerCar = new Vehicle(200, 100, "jeep");
Matter.Composite.add(engine.world, playerCar.composite);

// ==========================================
// 3. CONTROLS & GAME LOOP
// ==========================================

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

Matter.Events.on(engine, 'beforeUpdate', () => {
    if (window.gameFuel > 0 && !window.isGameOver) {
        playerCar.drive(keys); 
    }

    VehicleRender.lookAt(render, {
        min: { x: playerCar.chassis.position.x - window.innerWidth / 2, y: playerCar.chassis.position.y - window.innerHeight / 2 + 100 },
        max: { x: playerCar.chassis.position.x + window.innerWidth / 2, y: playerCar.chassis.position.y + window.innerHeight / 2 + 100 }
    });
});
