const { createCanvas, registerFont } = require("canvas");
const GIFEncoder = "gif-encoder-2" in require ? require("gif-encoder-2") : require("gif-encoder-2");
const fs = require("fs");
const path = require("path");

registerFont(path.join(__dirname, 'font.ttf'), { family: 'MyGlobalFont' });

async function spinWheel(players) {
    const numPlayers = players.length;

    let rawSize = 900 + (Math.pow(numPlayers / 150, 0.85) * 400);
    let size = Math.round(Math.min(Math.max(rawSize, 900), 1400));

    const fontSize = Math.max(16, Math.round(size * 0.038)); 
    const textOffset = Math.round(size * 0.08);
    const borderSize = Math.max(5, Math.round(size * 0.007)); 

    const gifPath = path.join(__dirname, "spin.gif");
    const encoder = new (require("gif-encoder-2"))(size, size);
    const stream = fs.createWriteStream(gifPath);

    encoder.createReadStream().pipe(stream);
    encoder.start();
    encoder.setRepeat(-1); 
    encoder.setDelay(35);
    encoder.setQuality(1); 

    const winnerIndex = Math.floor(Math.random() * numPlayers);
    const winner = players[winnerIndex];
    const slice = (Math.PI * 2) / numPlayers;
    
    // ضبط زاوية الدوران الصحيحة لتتطابق مع مكان السهم على اليمين تماماً
    const finalRotation = (Math.PI * 2 * 4) - (winnerIndex * slice) - (slice / 2) - (Math.PI / 2);
    const frames = 100;
    
    const nameLimit = numPlayers > 50 ? 11 : (numPlayers > 20 ? 13 : 16);
    const names = players.map(p => {
        return (p.displayName || "Player").substring(0, nameLimit);
    });
    
    // ألوان هادئة ومريحة
    const colors = [];
    for (let c = 0; c < numPlayers; c++) {
        const hue = Math.round((c * 360) / numPlayers);
        colors.push(`hsl(${hue}, 45%, 55%)`);
    }

    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    for (let i = 0; i < frames; i++) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext("2d");
        const progress = i / (frames - 1);
        const rotation = finalRotation * easeOutCubic(progress);

        // ⬜ ملء خلفية الكانفاس بالكامل باللون الأبيض للقضاء على السواد نهائياً
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);

        const radius = (size / 2) - 20;

        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate(rotation);

        for (let j = 0; j < numPlayers; j++) {
            const angle = j * slice;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, angle, angle + slice);
            ctx.closePath();
            ctx.fillStyle = colors[j]; 
            ctx.fill();
            
            // خطوط بيضاء فاصلة سميكة وواضحة
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = borderSize;
            ctx.stroke();

            ctx.save();
            ctx.rotate(angle + slice / 2);
            ctx.fillStyle = "#FFFFFF"; 
            ctx.font = `bold ${fontSize}px "MyGlobalFont"`; 
            ctx.textAlign = "right";
            ctx.textBaseline = 'middle';
            ctx.fillText(names[j], radius - textOffset, 0);
            ctx.restore();
        }
        ctx.restore();

        // ⭕ إطار خارجي أبيض يحيط بالعجلة بالكامل
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = borderSize;
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        const arrowTipX = size - 35; 
        const arrowBaseX = size;     
        const arrowY = size / 2;
        const arrowHeight = Math.round(size * 0.075);

        ctx.moveTo(arrowTipX, arrowY); 
        ctx.lineTo(arrowBaseX, arrowY - arrowHeight);
        ctx.lineTo(arrowBaseX, arrowY + arrowHeight);
        ctx.closePath();
        
        ctx.fillStyle = "#FFD700";    
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        encoder.addFrame(ctx);
    }
    encoder.finish();
    await new Promise(res => stream.on("finish", res));
    return { winner, gifPath };
}

module.exports = { spinWheel };