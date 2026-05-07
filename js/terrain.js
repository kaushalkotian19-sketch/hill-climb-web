// terrain.js - Perfect Camera Sync & HD Renderer

const Bodies = Matter.Bodies;
const World = Matter.World;

const segmentWidth = 40;     
const baseHeight = window.innerHeight - 100;

const activeSegments = {};
let lastCarX = null; 

// --- WORLD MATH ---
function getWaveHeight(index) {
    if (index <= 20) return 0; 
    const i = index - 20;
    const mountain1 = Math.sin(i * 0.011) * 200; 
    const mountain2 = Math.sin(i * 0.017) * 150; 
    const hill = Math.sin(i * 0.053) * 70; 
    const bump = Math.sin(i * 0.31) * Math.sin(i * 0.47) * 25; 
    return mountain1 + mountain2 + hill + bump;
}

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

    // Invisible Physics Ground
    const chunk = Bodies.rectangle(midX, midY + 200, distance + 15, 400, { 
        isStatic: true, angle: angle, friction: 0.9, label: 'ground', render: { visible: false } 
    });
    parts.push(chunk);

    if (index % 12 === 0 && index > 15) {
        parts.push(Bodies.circle(midX, midY - 45, 15, { isStatic: true, isSensor: true, label: 'coin', render: { sprite: { texture: 'assets/coin.png', xScale: 0.04, yScale: 0.04 } } }));
    }
    if (index % 40 === 0 && index > 25) {
        parts.push(Bodies.rectangle(midX, midY - 60, 30, 40, { isStatic: true, isSensor: true, label: 'fuel', render: { fillStyle: '#ff0000' } }));
    }

    activeSegments[index] = parts;
    for (let j = 0; j < parts.length; j++) { World.add(engine.world, parts[j]); }
}

function removeSegment(index) {
    if (!activeSegments[index]) return;
    const parts = activeSegments[index];
    for (let j = 0; j < parts.length; j++) { World.remove(engine.world, parts[j]); }
    delete activeSegments[index];
}

// Pre-build starting area
for (let i = 0; i < 100; i++) { spawnSegment(i); }

Matter.Events.on(engine, 'beforeUpdate', () => {
    if (!window.playerCar) return; 
    const carX = window.playerCar.chassis.position.x;
    
    if (lastCarX !== null && carX < lastCarX - 500) {
        for (const indexStr in activeSegments) { delete activeSegments[indexStr]; }
    }
    lastCarX = carX;

    const currentIndex = Math.floor(carX / segmentWidth);
    for (let i = currentIndex - 20; i <= currentIndex + 60; i++) {
        if (i >= 0 && !activeSegments[i]) spawnSegment(i);
    }
    for (const indexStr in activeSegments) {
        const i = parseInt(indexStr);
        if (i < currentIndex - 20 || i > currentIndex + 65) removeSegment(i);
    }
});

// ==========================================
// 🎨 THE "WORLD SPACE" RENDERER 🎨
// ==========================================
Matter.Events.on(render, 'beforeRender', function() {
    const ctx = render.context;
    if (!render.bounds) return; 

    // Find exactly where the camera is currently looking
    const cameraX = render.bounds.min.x; 
    const cameraY = render.bounds.min.y;
    const w = render.bounds.max.x - render.bounds.min.x; 
    const h = render.bounds.max.y - render.bounds.min.y;

    // 1. CLEAR SCREEN & DRAW SKY 
    // We draw the sky exactly matching the camera bounds so it acts as our screen wipe
    const gradient = ctx.createLinearGradient(0, cameraY, 0, cameraY + h);
    gradient.addColorStop(0, '#2b90d9'); 
    gradient.addColorStop(1, '#8bd3fb'); 
    ctx.fillStyle = gradient; 
    ctx.fillRect(cameraX, cameraY, w, h);

    // 2. PARALLAX MOUNTAINS
    function drawParallaxLayer(speed, color, heightOffset, zoom) {
        ctx.beginPath(); 
        ctx.moveTo(cameraX, cameraY + h); 
        
        for (let x = 0; x <= w + 50; x += 50) {
            const worldX = cameraX + x;
            // The Parallax Math: We multiply worldX by a fraction to slow the waves down!
            const mathX = worldX * speed; 
            const y = Math.sin(mathX * zoom) * 120 + Math.sin(mathX * zoom * 0.5) * 60;
            ctx.lineTo(worldX, cameraY + (h / 2) + heightOffset + y);
        }
        
        ctx.lineTo(cameraX + w, cameraY + h); 
        ctx.fillStyle = color; 
        ctx.fill();
    }

    drawParallaxLayer(0.2, '#5d8ba6', -50, 0.003); // Distant Mountains
    drawParallaxLayer(0.5, '#499a7b', 80, 0.006);  // Closer Foothills

    // 3. HD GRASS & DIRT
    const indices = Object.keys(activeSegments).map(Number).sort((a,b) => a - b);
    if (indices.length > 0) {
        const minIndex = indices[0]; 
        const maxIndex = indices[indices.length - 1];

        // Dirt Base Fill
        ctx.beginPath();
        ctx.moveTo(minIndex * segmentWidth, cameraY + h + 1000); 
        for (let i = minIndex; i <= maxIndex; i++) {
            ctx.lineTo(i * segmentWidth, baseHeight + getWaveHeight(i)); 
        }
        ctx.lineTo(maxIndex * segmentWidth, cameraY + h + 1000); 
        ctx.fillStyle = '#6D4C41'; 
        ctx.fill(); 

        // Thick Green Grass
        ctx.beginPath();
        for (let i = minIndex; i <= maxIndex; i++) {
            const x = i * segmentWidth; 
            const y = baseHeight + getWaveHeight(i);
            if (i === minIndex) ctx.moveTo(x, y); 
            else ctx.lineTo(x, y);
        }
        ctx.lineWidth = 22; 
        ctx.strokeStyle = '#43A047'; 
        ctx.lineJoin = 'round'; 
        ctx.lineCap = 'round'; 
        ctx.stroke(); 
        
        // Light Grass Highlight
        ctx.lineWidth = 8; 
        ctx.strokeStyle = '#81C784'; 
        ctx.stroke(); 
    }
});
