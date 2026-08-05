const { createCanvas, registerFont } = require("canvas");
const GIFEncoder = "gif-encoder-2" in require ? require("gif-encoder-2") : require("gif-encoder-2");
const fs = require("fs");
const path = require("path");

registerFont(path.join(__dirname, 'font.ttf'), { family: 'MyGlobalFont' });

async function spinWheel(players) {
    const numPlayers = players.length;

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
    encoder.setDelay(35);
    encoder.setQuality(1); 

    const winnerIndex = Math.floor(Math.random() * numPlayers);
    const winner = players[winnerIndex];
    const slice = (Math.PI * 2) / numPlayers;
    
    const finalRotation = (Math.PI * 2 * 5) - (winnerIndex * slice) - (slice / 2);
    const frames = 100; // 🌟 رجعناها 100 فريم مثل ما طلبت لسرعة طبيعية وسلسة
    
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

    // 🚀 تم نقل الكانفاس والـ context هنا لمرة واحدة فقط لتسريع المعالجة بشكل جنوني
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    
    ctx.patternQuality = 'best';
    ctx.quality = 'best';
    ctx.imageSmoothingEnabled = true;

    for (let i = 0; i < frames; i++) {

        const progress = i / (frames - 1);
        const rotation = finalRotation * easeOutCubic(progress);

        // خلفية بيضاء صافية
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);

        const radius = (size / 2) - 35; // 🌟 صغرنا الدائرة قليلاً لإعطاء مساحة أوسع وواضحة للسهم الخارجي

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

        // ◀️ السهم الكبير جداً والواضح والبارز للخارج (مطابق تماماً للصورة الثانية وكبير ومستحيل ما تنتبه له)
        ctx.save();
        ctx.beginPath();
        const arrowTipX = size - 35; // رأس السهم يلامس الدائرة بدقة
        const arrowBaseX = size;     // قاعدة السهم تصل لآخر حافة الكانفاس لتكون ضخمة وواضحة
        const arrowY = size / 2;
        const arrowHeight = Math.round(size * 0.100); // 🌟 حجم ضخم وبارز جداً مثل الصورة الثانية

        ctx.moveTo(arrowTipX, arrowY); 
        ctx.lineTo(arrowBaseX, arrowY - arrowHeight);
        ctx.lineTo(arrowBaseX, arrowY + arrowHeight);
        ctx.closePath();
        
        ctx.fillStyle = "#FFFFFF"; 
        ctx.fill();
        ctx.strokeStyle = "#B0B0B0"; // إطار رمادي فاتح وواضح لكي يبرز السهم تماماً عن خلفية الديسكورد البيضاء
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        encoder.addFrame(ctx);
    }
    encoder.finish();
    await new Promise(res => stream.on("finish", res));
    return { winner, gifPath };
}

module.exports = { spinWheel };