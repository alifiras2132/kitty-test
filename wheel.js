const { createCanvas, registerFont } = require("canvas");
const GIFEncoder = "gif-encoder-2" in require ? require("gif-encoder-2") : require("gif-encoder-2");
const fs = require("fs");
const path = require("path");

// تسجيل الخط (تأكد أن ملف font.ttf هو خط Noto Sans Arabic)
registerFont(path.join(__dirname, 'font.ttf'), { family: 'MyGlobalFont' });

async function spinWheel(players) {
    const numPlayers = players.length;

    // 🌟 رفع الحجم الأساسي لزيادة الوضوح والجودة العالية
    let rawSize = 900 + (Math.pow(numPlayers / 150, 0.85) * 400);
    let size = Math.round(Math.min(Math.max(rawSize, 900), 1400));

    // 🔤 تكبير حجم الخط والحدود ليناسب الجودة العالية الجديدة
    const fontSize = Math.max(16, Math.round(size * 0.038)); // تكبير الخط
    const textOffset = Math.round(size * 0.08);
    const borderSize = Math.max(4, Math.round(size * 0.005)); // حدود أسمك وأوضح

    const gifPath = path.join(__dirname, "spin.gif");
    const encoder = new (require("gif-encoder-2"))(size, size);
    const stream = fs.createWriteStream(gifPath);

    encoder.createReadStream().pipe(stream);
    encoder.start();
    encoder.setRepeat(-1); 
    encoder.setDelay(35);
    encoder.setQuality(1); // 💎 أقصى جودة ممكنة للـ GIF

    const winnerIndex = Math.floor(Math.random() * numPlayers);
    const winner = players[winnerIndex];
    const slice = (Math.PI * 2) / numPlayers;
    const finalRotation = (Math.PI * 2 * 4) - (winnerIndex * slice) - (slice / 2) - (Math.PI / 2);
    const frames = 100;
    
    const nameLimit = numPlayers > 50 ? 11 : (numPlayers > 20 ? 13 : 16);
    const names = players.map(p => {
        return (p.displayName || "Player").substring(0, nameLimit);
    });
    
    // 🎨 ألوان زاهية وواضحة
    const colors = [];
    for (let c = 0; c < numPlayers; c++) {
        const hue = Math.round((c * 360) / numPlayers);
        colors.push(`hsl(${hue}, 80%, 52%)`);
    }

    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    for (let i = 0; i < frames; i++) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext("2d");
        const progress = i / (frames - 1);
        const rotation = finalRotation * easeOutCubic(progress);

        ctx.clearRect(0, 0, size, size);

        // ⚪ خلفية بيضاء بالكامل للخلفية الدائرية لمنع ظهور أي سواد مزعج
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate(rotation);

        for (let j = 0; j < numPlayers; j++) {
            const angle = j * slice;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            // جعل الدائرة تملأ الإطار بالكامل بدلاً من ترك فراغات سوداء
            ctx.arc(0, 0, (size / 2) - 10, angle, angle + slice);
            ctx.closePath();
            ctx.fillStyle = colors[j]; 
            ctx.fill();
            
            // ⬜ إطار أبيض واضح وفخم بين الأقسام
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = borderSize;
            ctx.stroke();

            ctx.save();
            ctx.rotate(angle + slice / 2);
            ctx.fillStyle = "#FFFFFF"; // لون النص أبيض ساطع
            ctx.font = `bold ${fontSize}px "MyGlobalFont"`; 
            ctx.textAlign = "right";
            ctx.textBaseline = 'middle';
            ctx.fillText(names[j], (size / 2) - textOffset, 0);
            ctx.restore();
        }
        ctx.restore();

        // 🔽 سهم المؤشر العلوي
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.beginPath();
        const arrowY = Math.round(size * 0.01);
        const arrowTip = Math.round(size * 0.065);
        const arrowWidth = Math.round(size * 0.022);

        ctx.moveTo(size / 2 - arrowWidth, arrowY); 
        ctx.lineTo(size / 2 + arrowWidth, arrowY); 
        ctx.lineTo(size / 2, arrowTip);      
        ctx.closePath();
        ctx.fillStyle = "#FFD700";    
        ctx.fill();
        // إطار بسيط للسهم لزيادة وضوحه
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