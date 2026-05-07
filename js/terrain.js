// terrain.js - Absolute Flawless Screen Mapping

const Bodies = Matter.Bodies;
const World = Matter.World;

const segmentWidth = 40;     
const baseHeight = window.innerHeight - 100;

const activeSegments = {};
let lastCarX = null; 

// --- WORLD MATH ---
function getWaveHeight(index) {
    if (index <= 20) return 0; // Flat starting runway
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
// 🎨 ABSOLUTE SCREEN MAPPING RENDERER 🎨
// ==========================================
Matter.Events.on(render, 'beforeRender', function() {
    const ctx = render.context;
    if (!render.bounds) return; 

    const b = render.bounds;
    const cw = render.options.width;
    const ch = render.options.height;

    // 🚨 THE MAGIC FIX: Convert World Coordinates exactly to Screen Coordinates!
    function mapX(x) { return (x - b.min.x) * (cw / (b.max.x - b.min.x)); }
    function mapY(y) { return (y - b.min.y) * (ch / (b.max.y - b.min.y)); }

    // 1. SKY (Locked to screen size)
    const gradient = ctx.createLinearGradient(0, 0, 0, ch);
    gradient.addColorStop(0, '#2b90d9'); 
    gradient.addColorStop(1, '#8bd3fb'); 
    ctx.fillStyle = gradient; 
    ctx.fillRect(0, 0, cw, ch);

    // 2. PARALLAX MOUNTAINS (Properly calculated to move slowly)
    function drawParallaxLayer(speed, color, heightOffset, zoom) {
        ctx.beginPath(); 
        ctx.moveTo(0, ch); 

        for (let screenX = 0; screenX <= cw + 50; screenX += 50) {
            // Find the world coordinate for this pixel on the screen
            const worldX = b.min.x + screenX * ((b.max.x - b.min.x) / cw);
            const mathX = worldX * speed; 
            const waveY = Math.sin(mathX * zoom) * 120 + Math.sin(mathX * zoom * 0.5) * 60;
            const worldY = baseHeight - 150 + heightOffset + waveY;
            
            // Draw using our mapper!
            ctx.lineTo(screenX, mapY(worldY));
        }

        ctx.lineTo(cw, ch); 
        ctx.fillStyle = color; 
        ctx.fill();
    }

    drawParallaxLayer(0.2, '#5d8ba6', -50, 0.003); // Distant Mountains
    drawParallaxLayer(0.5, '#499a7b', 80, 0.006);  // Closer Foothills

    // 3. HD GRASS & DIRT (Drawn precisely over the physics blocks)
    const indices = Object.keys(activeSegments).map(Number).sort((a,b) => a - b);
    if (indices.length > 0) {
        const minIndex = indices[0]; 
        const maxIndex = indices[indices.length - 1];

        // Dirt Base Fill
        ctx.beginPath();
        ctx.moveTo(mapX(minIndex * segmentWidth), ch + 500); // 500px off the bottom
        for (let i = minIndex; i <= maxIndex; i++) {
            const worldX = i * segmentWidth;
            const worldY = baseHeight + getWaveHeight(i);
            ctx.lineTo(mapX(worldX), mapY(worldY)); 
        }
        ctx.lineTo(mapX(maxIndex * segmentWidth), ch + 500); 
        ctx.fillStyle = '#6D4C41'; 
        ctx.fill(); 

        // Thick Green Grass
        ctx.beginPath();
        for (let i = minIndex; i <= maxIndex; i++) {
            const worldX = i * segmentWidth;
            const worldY = baseHeight + getWaveHeight(i);
            if (i === minIndex) ctx.moveTo(mapX(worldX), mapY(worldY)); 
            else ctx.lineTo(mapX(worldX), mapY(worldY));
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
