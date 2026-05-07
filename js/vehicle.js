// vehicle.js - Reusable Vehicle Blueprint and Controls

const Constraint = Matter.Constraint;
const VehicleRender = Matter.Render; 

class Vehicle {
    constructor(startX, startY, vehicleType) {
        
        // --- 1. RECALIBRATED STATS ---
        const stats = {
            jeep: {
                width: 180, height: 50, weight: 0.002, // Taller physical box so it balances well
                wheelSize: 22, wheelGrip: 1.0,         
                suspensionStiffness: 0.12, suspensionDamping: 0.03, // Bouncy
                power: 0.12, // Fast
                imageScale: 0.14, // Matches the width of the physical box perfectly
                wheelScale: 0.04
            },
            monster_truck: {
                width: 200, height: 60, weight: 0.005, 
                wheelSize: 35, wheelGrip: 1.2,         
                suspensionStiffness: 0.2, suspensionDamping: 0.1, 
                power: 0.15,
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
            render: { 
                sprite: { 
                    texture: 'assets/chassis.png', 
                    xScale: this.config.imageScale, 
                    yScale: this.config.imageScale 
                } 
            } 
        });

        // The Driver's Head (Invisible hitbox for crashes)
        this.head = Matter.Bodies.circle(startX, startY - 30, 15, {
            collisionFilter: { group: carGroup }, 
            density: 0.001, label: 'head', render: { fillStyle: 'transparent' } 
        });

        const neck = Constraint.create({
            bodyA: this.chassis, pointA: { x: 0, y: -this.config.height / 2 }, 
            bodyB: this.head, pointB: { x: 0, y: 0 }, stiffness: 1, length: 20, render: { visible: false } 
        });

        // --- 3. BUILD THE WHEELS (FIXED ALIGNMENT) ---
        const wheelOptions = {
            collisionFilter: { group: carGroup }, friction: this.config.wheelGrip, restitution: 0.1, 
            render: { 
                sprite: { 
                    texture: 'assets/wheel.png', 
                    xScale: this.config.wheelScale, 
                    yScale: this.config.wheelScale 
                } 
            }  
        };

        // --- HARDCODED ALIGNMENT FOR YOUR SPECIFIC IMAGE ---
        // Left/Right distance from the center
        const wheelOffsetX = 65; 
        // Push the wheels DOWN 60 pixels from the center of the car body
        const wheelOffsetY = 60; 

        this.wheelA = Matter.Bodies.circle(startX - wheelOffsetX, startY + wheelOffsetY, this.config.wheelSize, wheelOptions); 
        this.wheelB = Matter.Bodies.circle(startX + wheelOffsetX, startY + wheelOffsetY, this.config.wheelSize, wheelOptions); 

        // --- 4. BUILD THE SUSPENSION ---
        const axelA = Constraint.create({
            bodyA: this.chassis, 
            pointA: { x: -wheelOffsetX, y: 20 }, // Attach near the bottom of the physical box
            bodyB: this.wheelA, 
            stiffness: this.config.suspensionStiffness, damping: this.config.suspensionDamping,   
            length: 45, // Long spring to allow the wheels to hang low
            render: { visible: false } 
        });

        const axelB = Constraint.create({
            bodyA: this.chassis, 
            pointA: { x: wheelOffsetX, y: 20 },
            bodyB: this.wheelB, 
            stiffness: this.config.suspensionStiffness, damping: this.config.suspensionDamping,
            length: 45, 
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
// 2. WAIT FOR MENU (Don't spawn automatically)
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
    // Only track camera and drive if a car has spawned
    if (!window.playerCar) return; 

    if (window.gameFuel > 0 && !window.isGameOver) {
        window.playerCar.drive(keys); 
    }

    VehicleRender.lookAt(render, {
        min: { x: window.playerCar.chassis.position.x - window.innerWidth / 2, y: window.playerCar.chassis.position.y - window.innerHeight / 2 + 100 },
        max: { x: window.playerCar.chassis.position.x + window.innerWidth / 2, y: window.playerCar.chassis.position.y + window.innerHeight / 2 + 100 }
    });
});
