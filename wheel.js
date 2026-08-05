const { createCanvas, registerFont } = require("canvas");
const GIFEncoder = require("gif-encoder-2");
const fs = require("fs");
const path = require("path");

// تسجيل الخط (تأكد أن ملف font.ttf هو خط Noto Sans Arabic)
registerFont(path.join(__dirname, 'font.ttf'), { family: 'MyGlobalFont' });

async function spinWheel(players) {
    const size = 600;
    const gifPath = path.join(__dirname, "spin.gif");
    const encoder = new GIFEncoder(size, size);
    const stream = fs.createWriteStream(gifPath);

    encoder.createReadStream().pipe(stream);
    encoder.start();
    encoder.setRepeat(-1); 
    encoder.setDelay(40);
    encoder.setQuality(10); 

    const winnerIndex = Math.floor(Math.random() * players.length);
    const winner = players[winnerIndex];
    const slice = (Math.PI * 2) / players.length;
    const finalRotation = (Math.PI * 2 * 4) - (winnerIndex * slice) - (slice / 2) - (Math.PI / 2);
    const frames = 100;
    
    // تجهيز الأسماء (يتم أخذ الاسم كما هو)
    const names = players.map(p => {
        return (p.displayName || "Player").substring(0, 10);
    });
    
    const colors = ["#E74C3C", "#3498DB", "#2ECC71", "#F1C40F", "#9B59B6", "#1ABC9C", "#E67E22", "#34495E"];
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    for (let i = 0; i < frames; i++) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext("2d");
        const progress = i / (frames - 1);
        const rotation = finalRotation * easeOutCubic(progress);

        ctx.clearRect(0, 0, size, size);
        
        // رسم العجلة مع التدوير
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate(rotation);

        for (let j = 0; j < players.length; j++) {
            const angle = j * slice;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, (size / 2) - 20, angle, angle + slice);
            ctx.closePath();
            ctx.fillStyle = colors[j % colors.length];
            ctx.fill();
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.save();
            ctx.rotate(angle + slice / 2);
            ctx.fillStyle = "white";
            ctx.font = `bold 22px "MyGlobalFont"`; 
            ctx.textAlign = "right";
            ctx.textBaseline = 'middle';
            ctx.fillText(names[j], (size / 2) - 40, 0);
            ctx.restore();
        }
        ctx.restore(); // نهاية التدوير

        // رسم السهم الأصفر الثابت في الأعلى
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.beginPath();
        ctx.moveTo(size / 2 - 20, 20); 
        ctx.lineTo(size / 2 + 20, 20); 
        ctx.lineTo(size / 2, 60);      
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