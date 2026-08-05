const { createCanvas, registerFont } = require("canvas");
const GIFEncoder = "gif-encoder-2" in require ? require("gif-encoder-2") : require("gif-encoder-2");
const fs = require("fs");
const path = require("path");

// تسجيل الخط (تأكد أن ملف font.ttf هو خط Noto Sans Arabic)
registerFont(path.join(__dirname, 'font.ttf'), { family: 'MyGlobalFont' });

async function spinWheel(players) {
    const numPlayers = players.length;

    // 🌟 معادلة التدرج الخرافي والمرن للحجم
    let rawSize = 600 + (Math.pow(numPlayers / 150, 0.85) * 600);
    let size = Math.round(Math.min(Math.max(rawSize, 600), 1200));

    const fontSize = Math.max(11, Math.round(size * 0.025));
    const textOffset = Math.round(size * 0.065);
    const borderSize = Math.max(2, Math.round(size * 0.0025));

    const gifPath = path.join(__dirname, "spin.gif");
    const encoder = new (require("gif-encoder-2"))(size, size);
    const stream = fs.createWriteStream(gifPath);

    encoder.createReadStream().pipe(stream);
    encoder.start();
    encoder.setRepeat(-1); 
    encoder.setDelay(40);
    encoder.setQuality(10); 

    const winnerIndex = Math.floor(Math.random() * numPlayers);
    const winner = players[winnerIndex];
    const slice = (Math.PI * 2) / numPlayers;
    const finalRotation = (Math.PI * 2 * 4) - (winnerIndex * slice) - (slice / 2) - (Math.PI / 2);
    const frames = 100;
    
    const nameLimit = numPlayers > 50 ? 11 : (numPlayers > 20 ? 13 : 15);
    const names = players.map(p => {
        return (p.displayName || "Player").substring(0, nameLimit);
    });
    
    // 🎨 توليد ألوان فريدة وحيوية موزعة على دائرة الألوان (HSL) لكل لاعب لضمان التنوع البصري الهائل
    const colors = [];
    for (let c = 0; c < numPlayers; c++) {
        const hue = Math.round((c * 360) / numPlayers);
        // نثبت السطوع والإضاءة حتى تكون الألوان زاهية وواضحة وليست مظلمة أو باهتة
        colors.push(`hsl(${hue}, 75%, 50%)`);
    }

    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    for (let i = 0; i < frames; i++) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext("2d");
        const progress = i / (frames - 1);
        const rotation = finalRotation * easeOutCubic(progress);

        ctx.clearRect(0, 0, size, size);
        
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate(rotation);

        for (let j = 0; j < numPlayers; j++) {
            const angle = j * slice;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, (size / 2) - 15, angle, angle + slice);
            ctx.closePath();
            ctx.fillStyle = colors[j]; // استخدام اللون الفريد الخاص بهذا اللاعب
            ctx.fill();
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = borderSize;
            ctx.stroke();

            ctx.save();
            ctx.rotate(angle + slice / 2);
            ctx.fillStyle = "white";
            ctx.font = `bold ${fontSize}px "MyGlobalFont"`; 
            ctx.textAlign = "right";
            ctx.textBaseline = 'middle';
            ctx.fillText(names[j], (size / 2) - textOffset, 0);
            ctx.restore();
        }
        ctx.restore();

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.beginPath();
        const arrowY = Math.round(size * 0.015);
        const arrowTip = Math.round(size * 0.06);
        const arrowWidth = Math.round(size * 0.018);

        ctx.moveTo(size / 2 - arrowWidth, arrowY); 
        ctx.lineTo(size / 2 + arrowWidth, arrowY); 
        ctx.lineTo(size / 2, arrowTip);      
        ctx.closePath();
        ctx.fillStyle = "#FFD700";    
        ctx.fill();
        ctx.restore();

        encoder.addFrame(ctx);
    }
    encoder.finish();
    await new Promise(res => stream.on("finish", res));
    return { winner, gifPath };
}

module.exports = { spinWheel };