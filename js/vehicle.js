// vehicle.js - Reusable Vehicle Blueprint and Controls

const Constraint = Matter.Constraint;
const VehicleRender = Matter.Render; 

class Vehicle {
    constructor(startX, startY, vehicleType) {
        
        // --- 1. THE PERFECT ARCADE TUNE ---
        const stats = {
            jeep: {
                width: 160, height: 40, weight: 0.004, 
                wheelSize: 22, wheelGrip: 1.2,         
                suspensionStiffness: 0.15, suspensionDamping: 0.05, // Soft, bouncy shocks
                power: 0.04, // This is now Angular Velocity speed, not weak torque!
                imageScale: 0.14, 
                wheelScale: 0.045
            },
            monster_truck: {
                width: 190, height: 50, weight: 0.006, 
                wheelSize: 35, wheelGrip: 1.5,         
                suspensionStiffness: 0.2, suspensionDamping: 0.08, 
                power: 0.06, // Faster spin for the Monster Truck
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
            chamfer: { radius: 20 }, // Sled corners so it doesn't get stuck on dirt
            render: { 
                sprite: { texture: 'assets/chassis.png', xScale: this.config.imageScale, yScale: this.config.imageScale } 
            } 
        });

        this.head = Matter.Bodies.circle(startX, startY - 40, 10, {
            collisionFilter: { group: carGroup }, 
            density: 0.001, label: 'head', render: { fillStyle: 'transparent' } 
        });

        const neck = Constraint.create({
            bodyA: this.chassis, pointA: { x: 0, y: -this.config.height / 2 }, 
            bodyB: this.head, pointB: { x: 0, y: 0 }, stiffness: 1, length: 25, render: { visible: false } 
        });

        // --- 3. THE WHEELS ---
        const wheelOptions = {
            collisionFilter: { group: carGroup }, 
            friction: this.config.wheelGrip, 
            density: 0.002, 
            restitution: 0.1, 
            render: { 
                sprite: { texture: 'assets/wheel.png', xScale: this.config.wheelScale, yScale: this.config.wheelScale } 
            }  
        };

        const wheelOffsetX = 60; 
        
        // The Anchor Point is halfway down the car
        const wheelAnchorY = 40; 
        // The spring travel distance (BOUNCE ROOM)
        const springTravel = 20; 

        // We spawn the wheels at the fully extended spring length (Anchor + Travel)
        this.wheelA = Matter.Bodies.circle(startX - wheelOffsetX, startY + wheelAnchorY + springTravel, this.config.wheelSize, wheelOptions); 
        this.wheelB = Matter.Bodies.circle(startX + wheelOffsetX, startY + wheelAnchorY + springTravel, this.config.wheelSize, wheelOptions); 

        // --- 4. THE SUSPENSION (PROPER SPRINGS RESTORED) ---
        const axelA = Constraint.create({
            bodyA: this.chassis, 
            pointA: { x: -wheelOffsetX, y: wheelAnchorY }, // Attached to the Anchor
            bodyB: this.wheelA, 
            stiffness: this.config.suspensionStiffness, 
            damping: this.config.suspensionDamping,   
            length: springTravel, // Allows 20 pixels of bouncy travel!
            render: { visible: false } 
        });

        const axelB = Constraint.create({
            bodyA: this.chassis, 
            pointA: { x: wheelOffsetX, y: wheelAnchorY }, // Attached to the Anchor
            bodyB: this.wheelB, 
            stiffness: this.config.suspensionStiffness, 
            damping: this.config.suspensionDamping,
            length: springTravel, // Allows 20 pixels of bouncy travel!
            render: { visible: false } 
        });

        this.composite = Matter.Composite.create({
            bodies: [this.chassis, this.wheelA, this.wheelB, this.head],
            constraints: [axelA, axelB, neck]
        });
    }

    // --- FOOLPROOF DRIVING MECHANIC ---
    drive(keys) {
        // This caps the wheel speed so it doesn't spin infinitely fast
        const maxSpeed = 0.6; 

        // Instead of weak torque, we FORCE the wheels to rotate by directly changing their velocity
        if (keys.gas) { 
            if (this.wheelA.angularVelocity < maxSpeed) {
                Matter.Body.setAngularVelocity(this.wheelA, this.wheelA.angularVelocity + this.enginePower);
            }
            if (this.wheelB.angularVelocity < maxSpeed) {
                Matter.Body.setAngularVelocity(this.wheelB, this.wheelB.angularVelocity + this.enginePower);
            }
        }
        if (keys.brake) { 
            if (this.wheelA.angularVelocity > -maxSpeed) {
                Matter.Body.setAngularVelocity(this.wheelA, this.wheelA.angularVelocity - this.enginePower);
            }
            if (this.wheelB.angularVelocity > -maxSpeed) {
                Matter.Body.setAngularVelocity(this.wheelB, this.wheelB.angularVelocity - this.enginePower);
            }
        }
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
