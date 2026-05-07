// terrain.js - FULL FIXED HD TERRAIN SYSTEM

const Bodies = Matter.Bodies;
const World = Matter.World;

const segmentWidth = 40;
const baseHeight = window.innerHeight - 100;

const activeSegments = {};
let lastCarX = null;

// ==========================================
// 🌍 WORLD HEIGHT GENERATOR
// ==========================================
function getWaveHeight(index) {

    // Flat spawn area
    if (index <= 20) return 0;

    const i = index - 20;

    const mountain1 = Math.sin(i * 0.011) * 200;
    const mountain2 = Math.sin(i * 0.017) * 150;

    const hill = Math.sin(i * 0.053) * 70;

    const bump =
        Math.sin(i * 0.31) *
        Math.sin(i * 0.47) *
        25;

    return mountain1 + mountain2 + hill + bump;
}

// ==========================================
// 🧱 SPAWN TERRAIN SEGMENT
// ==========================================
function spawnSegment(index) {

    if (activeSegments[index]) return;

    const x1 = index * segmentWidth;
    const y1 = baseHeight + getWaveHeight(index);

    const x2 = (index + 1) * segmentWidth;
    const y2 = baseHeight + getWaveHeight(index + 1);

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const distance = Math.hypot(x2 - x1, y2 - y1);

    const angle = Math.atan2(y2 - y1, x2 - x1);

    const parts = [];

    // Physics ground
    const chunk = Bodies.rectangle(
        midX,
        midY + 200,
        distance + 15,
        400,
        {
            isStatic: true,
            angle: angle,
            friction: 0.9,
            label: 'ground',
            render: {
                visible: false
            }
        }
    );

    parts.push(chunk);

    // Coins
    if (index % 12 === 0 && index > 15) {

        parts.push(
            Bodies.circle(
                midX,
                midY - 45,
                15,
                {
                    isStatic: true,
                    isSensor: true,
                    label: 'coin',

                    render: {
                        sprite: {
                            texture: 'assets/coin.png',
                            xScale: 0.04,
                            yScale: 0.04
                        }
                    }
                }
            )
        );
    }

    // Fuel
    if (index % 40 === 0 && index > 25) {

        parts.push(
            Bodies.rectangle(
                midX,
                midY - 60,
                30,
                40,
                {
                    isStatic: true,
                    isSensor: true,
                    label: 'fuel',

                    render: {
                        sprite: {
                            texture: 'assets/fuel.png',
                            xScale: 0.12,
                            yScale: 0.12
                        }
                    }
                }
            )
        );
    }

    activeSegments[index] = parts;

    for (let j = 0; j < parts.length; j++) {
        World.add(engine.world, parts[j]);
    }
}

// ==========================================
// ❌ REMOVE OLD SEGMENTS
// ==========================================
function removeSegment(index) {

    if (!activeSegments[index]) return;

    const parts = activeSegments[index];

    for (let j = 0; j < parts.length; j++) {
        World.remove(engine.world, parts[j]);
    }

    delete activeSegments[index];
}

// ==========================================
// 🚀 PREBUILD START AREA
// ==========================================
for (let i = 0; i < 100; i++) {
    spawnSegment(i);
}

// ==========================================
// ♻️ TERRAIN STREAMING
// ==========================================
Matter.Events.on(engine, 'beforeUpdate', () => {

    if (!window.playerCar) return;

    const carX = window.playerCar.chassis.position.x;

    if (lastCarX !== null && carX < lastCarX - 500) {

        for (const indexStr in activeSegments) {
            delete activeSegments[indexStr];
        }
    }

    lastCarX = carX;

    const currentIndex =
        Math.floor(carX / segmentWidth);

    // Spawn nearby
    for (
        let i = currentIndex - 20;
        i <= currentIndex + 60;
        i++
    ) {

        if (i >= 0 && !activeSegments[i]) {
            spawnSegment(i);
        }
    }

    // Remove far terrain
    for (const indexStr in activeSegments) {

        const i = parseInt(indexStr);

        if (
            i < currentIndex - 20 ||
            i > currentIndex + 65
        ) {
            removeSegment(i);
        }
    }
});

// ==========================================
// 🎨 HD WORLD RENDERER
// ==========================================
Matter.Events.on(render, 'beforeRender', function () {

    const ctx = render.context;

    if (!render.bounds) return;

    const cameraX = render.bounds.min.x;
    const cameraY = render.bounds.min.y;

    const w =
        render.bounds.max.x -
        render.bounds.min.x;

    const h =
        render.bounds.max.y -
        render.bounds.min.y;

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

    gradient.addColorStop(0, '#2b90d9');
    gradient.addColorStop(1, '#8bd3fb');

    ctx.fillStyle = gradient;

    ctx.fillRect(cameraX, cameraY, w, h);

    // ==========================================
    // 🏔️ PARALLAX MOUNTAINS
    // ==========================================
    function drawParallaxLayer(
        speed,
        color,
        heightOffset,
        zoom
    ) {

        ctx.beginPath();

        ctx.moveTo(cameraX, cameraY + h);

        for (
            let x = 0;
            x <= w + 50;
            x += 50
        ) {

            const worldX = cameraX + x;

            const mathX = worldX * speed;

            const y =
                Math.sin(mathX * zoom) * 120 +
                Math.sin(mathX * zoom * 0.5) * 60;

            ctx.lineTo(
                worldX,
                cameraY +
                (h / 2) +
                heightOffset +
                y
            );
        }

        ctx.lineTo(cameraX + w, cameraY + h);

        ctx.fillStyle = color;

        ctx.fill();
    }

    drawParallaxLayer(
        0.2,
        '#5d8ba6',
        -50,
        0.003
    );

    drawParallaxLayer(
        0.5,
        '#499a7b',
        80,
        0.006
    );

    // ==========================================
    // 🌍 TERRAIN
    // ==========================================
    const indices =
        Object.keys(activeSegments)
            .map(Number)
            .sort((a, b) => a - b);

    if (indices.length > 0) {

        const minIndex = indices[0];
        const maxIndex =
            indices[indices.length - 1];

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

        ctx.fillStyle = '#4E342E';

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

        ctx.lineWidth = 35;

        ctx.strokeStyle = '#00FF00';

        ctx.lineJoin = 'round';

        ctx.lineCap = 'round';

        ctx.stroke();

        // Light highlight
        ctx.lineWidth = 10;

        ctx.strokeStyle = '#81C784';

        ctx.stroke();
    }
});
