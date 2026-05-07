// terrain.js - Bulletproof Infinite Generation & HD Renderer

const Bodies = Matter.Bodies;
const World = Matter.World;

const segmentWidth = 40;     
const baseHeight = window.innerHeight - 100;

const activeSegments = {};
let lastCarX = null; 

// --- THE ORGANIC WAVE MATH ---
function getWaveHeight(index) {
    if (index <= 20) return 0; // The flat starting runway
    
    const i = index - 20;
    
    const mountain1 = Math.sin(i * 0.011) * 200; 
    const mountain2 = Math.sin(i * 0.017) * 150; 
    const macro = mountain1 + mountain2;
    
    const hill = Math.sin(i * 0.053) * 70; 
    const bump = Math.sin(i * 0.31) * Math.sin(i * 0.47) * 25; 
    
    return macro + hill + bump;
}

// --- WORLD BUILDER ---
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

    // The Invisible Dirt Block
    const chunk = Bodies.rectangle(
        midX, midY + 200, distance + 15, 400,
        { 
            isStatic: true, 
            angle: angle, 
            friction: 0.9, 
            label: 'ground', 
            render: { visible: false } // Hidden so our custom renderer can draw HD grass!
        }
    );
    parts.push(chunk);

    // Spawn Coins
    if (index % 12 === 0 && index > 15) {
        const coin = Bodies.circle(midX, midY - 45, 15, {
            isStatic: true, isSensor: true, label: 'coin', 
            render: { sprite: { texture: 'assets/coin.png', xScale: 0.04, yScale: 0.04 } } 
        });
        parts.push(coin);
    }

    // Spawn Fuel
    if (index % 40 === 0 && index > 25) {
        const fuelCan = Bodies.rectangle(midX, midY - 60, 30, 40, {
            isStatic: true, isSensor: true, label: 'fuel', 
            render: { fillStyle: '#ff0000' } 
        });
        parts.push(fuelCan);
    }

    activeSegments[index] = parts;
    for (let j = 0; j < parts.length; j++) { World.add(engine.world, parts[j]); }
}

// --- WORLD DESTROYER ---
function removeSegment(index) {
    if (!activeSegments[index]) return;
    const parts = activeSegments[index];
    for (let j = 0; j < parts.length; j++) { World.remove(engine.world, parts[j]); }
    delete activeSegments[index];
}

// Pre-build start area
for (let i = 0; i < 100; i++) { spawnSegment(i); }

// --- THE INFINITE LOOP ---
Matter.Events.on(engine, 'beforeUpdate', () => {
    if (!window.playerCar) return; 

    const carX = window.playerCar.chassis.position.x;
    
    // Restart Detector
    if (lastCarX !== null && carX < lastCarX - 500) {
        for (const indexStr in activeSegments) { delete activeSegments[indexStr]; }
    }
    lastCarX = carX;

    const currentIndex = Math.floor(carX / segmentWidth);
    const renderFront = 60; 
    const renderBack = 20;  

    for (let i = currentIndex - renderBack; i <= currentIndex + renderFront; i++) {
        if (i >= 0 && !activeSegments[i]) spawnSegment(i);
    }

    for (const indexStr in activeSegments) {
        const i = parseInt(indexStr);
        if (i < currentIndex - renderBack || i > currentIndex + renderFront + 5) removeSegment(i);
    }
});

// ==========================================
// 🌤️ DYNAMIC PARALLAX BACKGROUND 🌤️
// ==========================================
Matter.Events.on(render, 'beforeRender', function() {
    const ctx = render.context;
    const bounds = render.bounds;
    
    const cameraX = bounds.min.x;
    const cameraY = bounds.min.y;
    const w = bounds.max.x - bounds.min.x;
    const h = bounds.max.y - bounds.min.y;

    const gradient = ctx.createLinearGradient(0, cameraY, 0, cameraY + h);
    gradient.addColorStop(0, '#2b90d9'); 
    gradient.addColorStop(1, '#8bd3fb'); 
    ctx.fillStyle = gradient;
    ctx.fillRect(cameraX, cameraY, w, h);

    function drawParallaxLayer(speed, color, heightOffset, zoom) {
        ctx.beginPath();
        ctx.moveTo(cameraX, cameraY + h); 
        
        const parallaxX = cameraX * speed; 
        
        for (let x = 0; x <= w + 50; x += 50) {
            const worldX = cameraX + x;
            const mathX = worldX - parallaxX;
            const y = Math.sin(mathX * zoom) * 120 + Math.sin(mathX * zoom * 0.5) * 60;
            ctx.lineTo(worldX, cameraY + (h / 2) + heightOffset + y);
        }
        
        ctx.lineTo(cameraX + w, cameraY + h); 
        ctx.fillStyle = color;
        ctx.fill();
    }

    drawParallaxLayer(0.9, '#5d8ba6', -50, 0.003); // Distant Mountains
    drawParallaxLayer(0.6, '#499a7b', 80, 0.006);  // Foothills
});

// ==========================================
// 🎨 CUSTOM HD TERRAIN RENDERER 🎨
// ==========================================
Matter.Events.on(render, 'afterRender', function() {
    const ctx = render.context;
    
    const indices = Object.keys(activeSegments).map(Number).sort((a,b) => a - b);
    if (indices.length === 0) return;

    const minIndex = indices[0];
    const maxIndex = indices[indices.length - 1];

    // DRAW DIRT
    ctx.beginPath();
    ctx.moveTo(minIndex * segmentWidth, window.innerHeight + 1500); 
    for (let i = minIndex; i <= maxIndex; i++) {
        const x = i * segmentWidth;
        const y = baseHeight + getWaveHeight(i);
        ctx.lineTo(x, y); 
    }
    ctx.lineTo(maxIndex * segmentWidth, window.innerHeight + 1500); 
    ctx.fillStyle = '#6D4C41'; 
    ctx.fill();

    // DRAW GRASS BASE
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
    
    // DRAW GRASS HIGHLIGHT
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#81C784'; 
    ctx.stroke();
});
