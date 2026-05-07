// terrain.js - FINAL WORKING MOUNTAIN TERRAIN

const Bodies = Matter.Bodies;
const World = Matter.World;

// ==========================================
// 🌍 WORLD SETTINGS
// ==========================================
const segmentWidth = 40;

// Higher terrain so mountains visible
const baseHeight = window.innerHeight - 350;

const activeSegments = {};

let lastCarX = null;

// ==========================================
// 🏔️ TERRAIN HEIGHT GENERATOR
// ==========================================
function getWaveHeight(index) {

    // Flat spawn area
    if (index <= 20) return 0;

    const i = index - 20;

    return (
        Math.sin(i * 0.08) * 120 +
        Math.sin(i * 0.03) * 200 +
        Math.sin(i * 0.2) * 35
    );
}

// ==========================================
// 🧱 SPAWN TERRAIN SEGMENT
// ==========================================
function spawnSegment(index) {

    if (activeSegments[index]) return;

    const x1 = index * segmentWidth;

    const y1 =
        baseHeight +
        getWaveHeight(index);

    const x2 =
        (index + 1) * segmentWidth;

    const y2 =
        baseHeight +
        getWaveHeight(index + 1);

    const midX = (x1 + x2) / 2;

    const midY = (y1 + y2) / 2;

    const distance =
        Math.hypot(x2 - x1, y2 - y1);

    const angle =
        Math.atan2(y2 - y1, x2 - x1);

    const parts = [];

    // ==========================================
    // 🌍 PHYSICS GROUND
    // ==========================================
    const chunk = Bodies.rectangle(
        midX,
        midY + 200,
        distance + 20,
        400,
        {
            isStatic: true,

            angle: angle,

            friction: 1,

            label: 'ground',

            render: {
                visible: false
            }
        }
    );

    parts.push(chunk);

    // ==========================================
    // 🪙 COINS
    // ==========================================
    if (index % 12 === 0 && index > 15) {

        parts.push(
            Bodies.circle(
                midX,
                midY - 60,
                15,
                {
                    isStatic: true,

                    isSensor: true,

                    label: 'coin',

                    render: {
                        sprite: {
                            texture:
                                'assets/coin.png',

                            xScale: 0.04,

                            yScale: 0.04
                        }
                    }
                }
            )
        );
    }

    // ==========================================
    // ⛽ FUEL
    // ==========================================
    if (index % 40 === 0 && index > 25) {

        parts.push(
            Bodies.rectangle(
                midX,
                midY - 80,
                35,
                45,
                {
                    isStatic: true,

                    isSensor: true,

                    label: 'fuel',

                    render: {
                        sprite: {
                            texture:
                                'assets/fuel.png',

                            xScale: 0.13,

                            yScale: 0.13
                        }
                    }
                }
            )
        );
    }

    activeSegments[index] = parts;

    for (let j = 0; j < parts.length; j++) {

        World.add(
            engine.world,
            parts[j]
        );
    }
}

// ==========================================
// ❌ REMOVE OLD SEGMENTS
// ==========================================
function removeSegment(index) {

    if (!activeSegments[index]) return;

    const parts = activeSegments[index];

    for (let j = 0; j < parts.length; j++) {

        World.remove(
            engine.world,
            parts[j]
        );
    }

    delete activeSegments[index];
}

// ==========================================
// 🚀 CREATE STARTING TERRAIN
// ==========================================
for (let i = 0; i < 100; i++) {

    spawnSegment(i);
}

// ==========================================
// ♻️ STREAM TERRAIN
// ==========================================
Matter.Events.on(
    engine,
    'beforeUpdate',
    () => {

        if (!window.playerCar) return;

        const carX =
            window.playerCar.chassis.position.x;

        if (
            lastCarX !== null &&
            carX < lastCarX - 500
        ) {

            for (const indexStr in activeSegments) {

                delete activeSegments[indexStr];
            }
        }

        lastCarX = carX;

        const currentIndex =
            Math.floor(
                carX / segmentWidth
            );

        // Spawn nearby terrain
        for (
            let i = currentIndex - 20;
            i <= currentIndex + 60;
            i++
        ) {

            if (
                i >= 0 &&
                !activeSegments[i]
            ) {

                spawnSegment(i);
            }
        }

        // Remove far terrain
        for (const indexStr in activeSegments) {

            const i =
                parseInt(indexStr);

            if (
                i < currentIndex - 20 ||
                i > currentIndex + 65
            ) {

                removeSegment(i);
            }
        }
    }
);

// ==========================================
// 🎨 DRAW WORLD
// ==========================================
Matter.Events.on(
    render,
    'afterRender',
    function () {

        const ctx = render.context;

        const bounds = render.bounds;

        if (!bounds) return;

        const cameraX = bounds.min.x;

        const cameraY = bounds.min.y;

        const w =
            bounds.max.x - bounds.min.x;

        const h =
            bounds.max.y - bounds.min.y;

        // ==========================================
        // 🌌 SKY
        // ==========================================
        const gradient =
            ctx.createLinearGradient(
                0,
                cameraY,
                0,
                cameraY + h
            );

        gradient.addColorStop(0, '#4FC3F7');

        gradient.addColorStop(1, '#B3E5FC');

        ctx.fillStyle = gradient;

        ctx.fillRect(
            cameraX,
            cameraY,
            w,
            h
        );

        // ==========================================
        // 🏔️ BACK MOUNTAINS
        // ==========================================
        ctx.beginPath();

        ctx.moveTo(
            cameraX,
            cameraY + h
        );

        for (
            let x = 0;
            x <= w + 100;
            x += 50
        ) {

            const worldX =
                cameraX + x;

            const y =
                cameraY +
                h / 2 +
                Math.sin(worldX * 0.002) * 150;

            ctx.lineTo(worldX, y);
        }

        ctx.lineTo(
            cameraX + w,
            cameraY + h
        );

        ctx.closePath();

        ctx.fillStyle = '#7AA874';

        ctx.fill();

        // ==========================================
        // 🌍 MAIN TERRAIN
        // ==========================================
        const indices =
            Object.keys(activeSegments)
                .map(Number)
                .sort((a, b) => a - b);

        if (indices.length > 0) {

            const minIndex = indices[0];

            const maxIndex =
                indices[
                    indices.length - 1
                ];

            // ==========================================
            // 🟫 DIRT
            // ==========================================
            ctx.beginPath();

            ctx.moveTo(
                minIndex * segmentWidth,
                cameraY + h + 1000
            );

            ctx.lineTo(
                minIndex * segmentWidth,
                baseHeight +
                getWaveHeight(minIndex)
            );

            for (
                let i = minIndex;
                i <= maxIndex;
                i++
            ) {

                ctx.lineTo(
                    i * segmentWidth,
                    baseHeight +
                    getWaveHeight(i)
                );
            }

            ctx.lineTo(
                maxIndex * segmentWidth,
                cameraY + h + 1000
            );

            ctx.closePath();

            ctx.fillStyle = '#6D4C41';

            ctx.fill();

            // ==========================================
            // 🌱 GRASS
            // ==========================================
            ctx.beginPath();

            for (
                let i = minIndex;
                i <= maxIndex;
                i++
            ) {

                const x =
                    i * segmentWidth;

                const y =
                    baseHeight +
                    getWaveHeight(i);

                if (i === minIndex) {

                    ctx.moveTo(x, y);

                } else {

                    ctx.lineTo(x, y);
                }
            }

            ctx.lineWidth = 30;

            ctx.strokeStyle = '#00FF00';

            ctx.lineJoin = 'round';

            ctx.lineCap = 'round';

            ctx.stroke();

            // Grass highlight
            ctx.lineWidth = 10;

            ctx.strokeStyle = '#7CFC00';

            ctx.stroke();
        }
    }
);
