// vehicle.js - Reusable Vehicle Blueprint and Controls

const Constraint = Matter.Constraint;
const VehicleRender = Matter.Render; 

class Vehicle {
    constructor(startX, startY, vehicleType) {
        
        // --- 1. RECALIBRATED STATS ---
        const stats = {
            jeep: {
                width: 170, height: 30, 
                weight: 0.0005, // SUPER LIGHTWEIGHT BODY!
                wheelSize: 22, wheelGrip: 1.2,         
                suspensionStiffness: 0.9, suspensionDamping: 0.1, 
                power: 0.18, // Boosted power to move the heavy tires
                imageScale: 0.14, 
                wheelScale: 0.045
            },
            monster_truck: {
                width: 200, height: 40, weight: 0.001, 
                wheelSize: 35, wheelGrip: 1.5,         
                suspensionStiffness: 0.95, suspensionDamping: 0.15, 
                power: 0.25,
                imageScale: 0.18, 
                wheelScale: 0.06
            }
        };
        
        this.config = stats[vehicleType] || stats.jeep;
        this.enginePower = this.config.power;

        const carGroup = Matter.Body.nextGroup(true);

        // --- 2. BUILD THE CHASSIS ---
        this.chassis = Matter.Bodies.rectangle(startX, startY, this.config.width, this.config.height, { 
            collisionFilter: { group: carGroup }, 
            density: this.config.weight, 
            chamfer: { radius: 10 }, // ROUNDS THE CORNERS SO IT GLIDES OVER DIRT!
            render: { 
                sprite: { 
                    texture: 'assets/chassis.png', 
                    xScale: this.config.imageScale, 
                    yScale: this.config.imageScale 
                } 
            } 
        });

        // The Driver's Head - Shrunk and moved higher for safety
        this.head = Matter.Bodies.circle(startX, startY - 40, 10, {
            collisionFilter: { group: carGroup }, 
            density: 0.001, label: 'head', render: { fillStyle: 'transparent' } 
        });

        const neck = Constraint.create({
            bodyA: this.chassis, pointA: { x: 0, y: -this.config.height / 2 }, 
            bodyB: this.head, pointB: { x: 0, y: 0 }, stiffness: 1, length: 25, render: { visible: false } 
        });

        // --- 3. BUILD THE WHEELS ---
        const wheelOptions = {
            collisionFilter: { group: carGroup }, 
            friction: this.config.wheelGrip, 
            density: 0.05, // HEAVY WHEELS for a low center of gravity
            restitution: 0.1, 
            render: { 
                sprite: { 
                    texture: 'assets/wheel.png', 
                    xScale: this.config.wheelScale, 
                    yScale: this.config.wheelScale 
                } 
            }  
        };

        const wheelOffsetX = 65; 
        const wheelOffsetY = 40; // Pushed down for maximum ground clearance

        this.wheelA = Matter.Bodies.circle(startX - wheelOffsetX, startY + wheelOffsetY, this.config.wheelSize, wheelOptions); 
        this.wheelB = Matter.Bodies.circle(startX + wheelOffsetX, startY + wheelOffsetY, this.config.wheelSize, wheelOptions); 

        // --- 4. BUILD THE SUSPENSION ---
        const axelA = Constraint.create({
            bodyA: this.chassis, 
            pointA: { x: -wheelOffsetX, y: 15 }, 
            bodyB: this.wheelA, 
            stiffness: this.config.suspensionStiffness, damping: this.config.suspensionDamping,   
            length: 30, // Longer spring to keep chassis far above the wheels
            render: { visible: false } 
        });

        const axelB = Constraint.create({
            bodyA: this.chassis, 
            pointA: { x: wheelOffsetX, y: 15 },
            bodyB: this.wheelB, 
            stiffness: this.config.suspensionStiffness, damping: this.config.suspensionDamping,
            length: 30, 
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

// ==========================================
// 2. WAIT FOR MENU 
// ==========================================
window.playerCar = null;

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
    if (!window.playerCar) return; 

    if (window.gameFuel > 0 && !window.isGameOver) {
        window.playerCar.drive(keys); 
    }

    VehicleRender.lookAt(render, {
        min: { x: window.playerCar.chassis.position.x - window.innerWidth / 2, y: window.playerCar.chassis.position.y - window.innerHeight / 2 + 100 },
        max: { x: window.playerCar.chassis.position.x + window.innerWidth / 2, y: window.playerCar.chassis.position.y + window.innerHeight / 2 + 100 }
    });
});
