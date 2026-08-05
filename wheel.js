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
    const borderSize = Math.max(5, Math.round(size * 0.007)); // خط أبيض سميك وواضح

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
    
    // ضبط زاوية التوقف بحيث يكون السهم على اليمين تماماً مثل الصورة الثانية
    const finalRotation = (Math.PI * 2 * 4) - (winnerIndex * slice) - (slice / 2);
    const frames = 100;
    
    const nameLimit = numPlayers > 50 ? 11 : (numPlayers > 20 ? 13 : 16);
    const names = players.map(p => {
        return (p.displayName || "Player").substring(0, nameLimit);
    });
    
    // 🎨 ألوان هادئة وغير فاقعة (قللنا السطوع لتبدو مثل الصورة الثانية)
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

        ctx.clearRect(0, 0, size, size);

        // إزالة السواد وجعل حدود الكانفاس نظيفة
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate(rotation);

        const radius = (size / 2) - 10;

        for (let j = 0; j < numPlayers; j++) {
            const angle = j * slice;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, angle, angle + slice);
            ctx.closePath();
            ctx.fillStyle = colors[j]; 
            ctx.fill();
            
            // خط أبيض فاصِل سميك ونظيف بين الأقسام
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

        // 🎯 رسم الإطار الخارجي الأبيض الدائري للعجلة بالكامل (مثل الصورة الثانية)
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = borderSize;
        ctx.stroke();

        // ◀️ تصميم السهم على الجانب الأيمن وبشكل بارز ومرتب تماماً مثل الصورة الثانية
        ctx.save();
        ctx.beginPath();
        const arrowX = size - 5;
        const arrowY = size / 2;
        const arrowSize = Math.round(size * 0.035);

        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - (arrowSize * 1.8), arrowY - arrowSize);
        ctx.lineTo(arrowX - (arrowSize * 1.8), arrowY + arrowSize);
        ctx.closePath();
        
        ctx.fillStyle = "#FFFFFF"; // سهم أبيض بالكامل ونظيف
        ctx.fill();
        ctx.strokeStyle = "#CCCCCC";
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