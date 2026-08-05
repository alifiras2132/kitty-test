const { createCanvas, registerFont } = require("canvas");
const GIFEncoder = "gif-encoder-2" in require ? require("gif-encoder-2") : require("gif-encoder-2");
const fs = require("fs");
const path = require("path");

registerFont(path.join(__dirname, 'font.ttf'), { family: 'MyGlobalFont' });

async function spinWheel(players) {
    const numPlayers = players.length;

    // رفع الدقة بشكل كبير جداً لضمان جودة فائقة وتفاصيل حادة
    let rawSize = 1200 + (Math.pow(numPlayers / 150, 0.85) * 400);
    let size = Math.round(Math.min(Math.max(rawSize, 1200), 1600));

    const fontSize = Math.max(20, Math.round(size * 0.038)); 
    const textOffset = Math.round(size * 0.08);
    const borderSize = Math.max(6, Math.round(size * 0.007)); 

    const gifPath = path.join(__dirname, "spin.gif");
    const encoder = new (require("gif-encoder-2"))(size, size);
    const stream = fs.createWriteStream(gifPath);

    encoder.createReadStream().pipe(stream);
    encoder.start();
    encoder.setRepeat(-1); 
    encoder.setDelay(30);
    encoder.setQuality(1); // أقصى جودة ممكنة

    const winnerIndex = Math.floor(Math.random() * numPlayers);
    const winner = players[winnerIndex];
    const slice = (Math.PI * 2) / numPlayers;
    
    // 🎯 تصحيح زاوية التوقف بدقة لتقع في منتصف شريحة الفائز تماماً (وليس على الخط الفاصل)
    const finalRotation = (Math.PI * 2 * 5) - (winnerIndex * slice) - (slice / 2);
    const frames = 120; // زيادة عدد الإطارات لسلاسة أكبر في الحركة
    
    const nameLimit = numPlayers > 50 ? 11 : (numPlayers > 20 ? 13 : 16);
    const names = players.map(p => {
        return (p.displayName || "Player").substring(0, nameLimit);
    });
    
    const colors = [];
    for (let c = 0; c < numPlayers; c++) {
        const hue = Math.round((c * 360) / numPlayers);
        colors.push(`hsl(${hue}, 45%, 55%)`);
    }

    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    for (let i = 0; i < frames; i++) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext("2d");
        
        // تحسين تنعيم الحواف (Anti-aliasing)
        ctx.patternQuality = 'best';
        ctx.quality = 'best';
        ctx.imageSmoothingEnabled = true;

        const progress = i / (frames - 1);
        const rotation = finalRotation * easeOutCubic(progress);

        // خلفية بيضاء بالكامل
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);

        const radius = (size / 2) - 25;

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

        // الإطار الخارجي الأبيض
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = borderSize;
        ctx.stroke();

        // ◀️ السهم الصحيح تماماً: أبيض ناصع، يشير للداخل باتجاه الفائز، ومرتب مثل الصورة المطلوبة
        ctx.save();
        ctx.beginPath();
        const arrowTipX = size - 25; // رأس السهم متصل بحافة الدائرة
        const arrowBaseX = size - 5;  // قاعدة السهم للخارج قليلاً
        const arrowY = size / 2;
        const arrowHeight = Math.round(size * 0.035);

        ctx.moveTo(arrowTipX, arrowY); // رأس السهم يشير لليسار (للداخل)
        ctx.lineTo(arrowBaseX, arrowY - arrowHeight);
        ctx.lineTo(arrowBaseX, arrowY + arrowHeight);
        ctx.closePath();
        
        ctx.fillStyle = "#FFFFFF"; // أبيض ناصع مثل المحيط
        ctx.fill();
        ctx.strokeStyle = "#E0E0E0"; // إطار خفيف ونظيف جداً لزيادة وضوحه
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        encoder.addFrame(ctx);
    }
    encoder.finish();
    await new Promise(res => stream.on("finish", res));
    return { winner, gifPath };
}

module.exports = { spinWheel };