const {
    Client,
    GatewayIntentBits,
    EmbedBuilder, AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require("discord.js");

const fs = require("fs");
const gameManager = require("./gamemanager.js");
const { spinWheel } = require("./wheel.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    rest: {
        timeout: 1000 * 60 * 5,
    }
});

const TOKEN = "YOUR_TOKEN_HERE"; // ⚠️ ضع توكن بوتك الحقيقي هنا
const PREFIX = '+';
const DB = "./mmo.json";

let isGameRunning = false; 

const ALLOWED_ROLES = ["owner", "manager", "Mod", "SR mod", "admin", "SR admin"];

function load() {
    if (!fs.existsSync(DB)) fs.writeFileSync(DB, "{}");
    try { return JSON.parse(fs.readFileSync(DB, "utf8")); } catch (e) { return {}; }
}

function save(d) { fs.writeFileSync(DB, JSON.stringify(d, null, 2)); }

function player(id) {
    const db = load();
    if (!db[id]) {
        db[id] = { coins: 100, xp: 0, level: 1, wins: 0, shield: 0, reflect: 0, skill: null };
        save(db);
    }
    return db[id];
}

function update(id, data) {
    const db = load(); db[id] = data; save(db);
}

// 🛡️ دالة معالجة النصوص لتجاهل الهمزات والأخطاء الإملائية الشائعة
function normalizeText(text) {
    if (!text) return "";
    return text
        .trim()
        .replace(/[أإآٱ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي");
}

// ==========================================
// 🏳️ قاعدة بيانات لعبة الأعلام
// ==========================================
const FLAGS_BY_DIFFICULTY = {
    سهل: [
        { name: "السعودية", image: "https://flagcdn.com/w640/sa.png" },
        { name: "مصر", image: "https://flagcdn.com/w640/eg.png" },
        { name: "الإمارات", image: "https://flagcdn.com/w640/ae.png" },
        { name: "الكويت", image: "https://flagcdn.com/w640/kw.png" },
        { name: "قطر", image: "https://flagcdn.com/w640/qa.png" },
        { name: "العراق", image: "https://flagcdn.com/w640/iq.png" },
        { name: "فلسطين", image: "https://flagcdn.com/w640/ps.png" },
        { name: "أمريكا", image: "https://flagcdn.com/w640/us.png" },
        { name: "بريطانيا", image: "https://flagcdn.com/w640/gb.png" },
        { name: "اليابان", image: "https://flagcdn.com/w640/jp.png" },
        { name: "فرنسا", image: "https://flagcdn.com/w640/fr.png" },
        { name: "ألمانيا", image: "https://flagcdn.com/w640/de.png" },
        { name: "البرازيل", image: "https://flagcdn.com/w640/br.png" },
        { name: "الأرجنتين", image: "https://flagcdn.com/w640/ar.png" },
        { name: "إيطاليا", image: "https://flagcdn.com/w640/it.png" },
        { name: "إسبانيا", image: "https://flagcdn.com/w640/es.png" },
        { name: "تركيا", image: "https://flagcdn.com/w640/tr.png" },
        { name: "كندا", image: "https://flagcdn.com/w640/ca.png" },
        { name: "بلجيكا", image: "https://flagcdn.com/w640/be.png" },
        { name: "المغرب", image: "https://flagcdn.com/w640/ma.png" }
    ],
    متوسط: [
        { name: "الجزائر", image: "https://flagcdn.com/w640/dz.png" },
        { name: "تونس", image: "https://flagcdn.com/w640/tn.png" },
        { name: "عمان", image: "https://flagcdn.com/w640/om.png" },
        { name: "البحرين", image: "https://flagcdn.com/w640/bh.png" },
        { name: "الأردن", image: "https://flagcdn.com/w640/jo.png" },
        { name: "سوريا", image: "https://flagcdn.com/w640/sy.png" },
        { name: "لبنان", image: "https://flagcdn.com/w640/lb.png" },
        { name: "اليمن", image: "https://flagcdn.com/w640/ye.png" },
        { name: "ليبيا", image: "https://flagcdn.com/w640/ly.png" },
        { name: "السودان", image: "https://flagcdn.com/w640/sd.png" },
        { name: "كوريا الجنوبية", image: "https://flagcdn.com/w640/kr.png" },
        { name: "روسيا", image: "https://flagcdn.com/w640/ru.png" },
        { name: "البرتغال", image: "https://flagcdn.com/w640/pt.png" },
        { name: "الصين", image: "https://flagcdn.com/w640/cn.png" },
        { name: "هولندا", image: "https://flagcdn.com/w640/nl.png" },
        { name: "الهند", image: "https://flagcdn.com/w640/in.png" },
        { name: "أستراليا", image: "https://flagcdn.com/w640/au.png" },
        { name: "اليونان", image: "https://flagcdn.com/w640/gr.png" },
        { name: "سويسرا", image: "https://flagcdn.com/w640/ch.png" },
        { name: "تشيلي", image: "https://flagcdn.com/w640/cl.png" }
    ],
    صعب: [
        { name: "المكسيك", image: "https://flagcdn.com/w640/mx.png" },
        { name: "أوروغواي", image: "https://flagcdn.com/w640/uy.png" },
        { name: "كولومبيا", image: "https://flagcdn.com/w640/co.png" },
        { name: "السويد", image: "https://flagcdn.com/w640/se.png" },
        { name: "النرويج", image: "https://flagcdn.com/w640/no.png" },
        { name: "الدنمارك", image: "https://flagcdn.com/w640/dk.png" },
        { name: "أيرلندا", image: "https://flagcdn.com/w640/ie.png" },
        { name: "رومانيا", image: "https://flagcdn.com/w640/ro.png" },
        { name: "جيبوتي", image: "https://flagcdn.com/w640/dj.png" },
        { name: "موريتانيا", image: "https://flagcdn.com/w640/mr.png" },
        { name: "الصومال", image: "https://flagcdn.com/w640/so.png" },
        { name: "جزر القمر", image: "https://flagcdn.com/w640/km.png" },
        { name: "نيجيريا", image: "https://flagcdn.com/w640/ng.png" },
        { name: "السنغال", image: "https://flagcdn.com/w640/sn.png" },
        { name: "الكاميرون", image: "https://flagcdn.com/w640/cm.png" },
        { name: "غانا", image: "https://flagcdn.com/w640/gh.png" },
        { name: "ساحل العاج", image: "https://flagcdn.com/w640/ci.png" },
        { name: "جنوب أفريقيا", image: "https://flagcdn.com/w640/za.png" },
        { name: "أوكرانيا", image: "https://flagcdn.com/w640/ua.png" },
        { name: "نيوزيلندا", image: "https://flagcdn.com/w640/nz.png" }
    ]
};

// ==========================================
// ⚡ بنك الكلمات والجمل المحدث للعبة أسرع
// ==========================================
const SPEED_WORDS = [
    "مطرقة", "برمجة", "ديسكورد", "شلال", "صاعقة", "حاسوب", "سيرفر", "قهوة", "مفتاح", "تحدي",
    "المانيا", "العراق", "مستقبل", "طاولة", "امبراطور", "اسطورة", "سفينة", "طائرة", "كوكب", "مجرة",
    "صقر", "نمر", "بركان", "زلزال", "عاصفة", "امطار", "الماس", "ياقوت", "شجاعة", "انتصار",
    "مملكة", "قلعة", "حارس", "سيف", "درع", "مغامرة", "تطوير", "سرعة", "بطولة", "ابداع"
];

const SPEED_SENTENCES = [
    "لا تؤجل عمل اليوم", "من جد وجد", "العلم نور", "الوقت كالسيف", "من طلب العلا",
    "الابتسامة صدقة", "النجاح يحتاج صبر", "سبحان الله وبحمده", "كن فخورا بنفسك", "أسرع يد بالسيرفر",
    "الحمد لله دائما", "الصحة تاج ذهبي", "القناعة كنز ثين", "الاتحاد قوة وعزيمة", "العقل زينة الإنسان",
    "الأمل يضيء الطريق", "الصدق منجاة للجميع", "تفائل بما تهوى", "الحياة تجارب مستمرة", "تحدي الصعاب دائما",
    "كن جميلا ترى الجمال", "السكوت علامة الرضا", "الخبرة أفضل معلم", "السرعة شعار الأبطال", "الوقت من ذهب",
    "الكتاب خير جليس", "اصبر تنل مرادك", "افعل الخير دائما", "الابتسامة تفتح القلوب", "الحق يعلو دائما",
    "لا تيأس من الحياة", "العلم يبني البيوت", "أجمل من في السيرفر", "عش يومك بسعادة", "كفو يا وحش"
];


/* =========================
    🏆 MMO MATCH LOOP (حجم العجلة الطبيعي)
========================= */
async function startMatch(channel) {
    const game = gameManager.getGame(channel.id);
    if (!game) return;

    gameManager.startGameFlag(channel.id);
    let playersInGame = [...game.players];

    await channel.send({ content: "✅ | تم الانتهاء من تسجيل الادوار ، ستبدأ الجولة الاولى بعد قليل..." });
    await new Promise(resolve => setTimeout(resolve, 2000)); 

    while (playersInGame.length > 1) {
        const isFinalRound = (playersInGame.length === 2);

        if (isFinalRound) {
            await channel.send({ content: "🏆 | تبقى لاعبين فقط ، من تختاره العجلة في الجولة التالية هو الفائز" });
            await new Promise(resolve => setTimeout(resolve, 1500)); 
        }

        const { winner, gifPath } = await spinWheel(playersInGame);
        
        const wheelMsg = await channel.send({ 
            content: "🎡 **تدور العجلة الآن...**",
            files: [{ attachment: gifPath, name: "spin.gif" }] 
        });

        await new Promise(resolve => setTimeout(resolve, 2000)); 

        const finalContent = isFinalRound 
            ? `🎉 | مبروك الفوز في اللعبة <@${winner.id}>` 
            : `<@${winner.id}>، لديك 15 ثانية لإختيار شخص لطرده.`;
            
        await wheelMsg.edit({ content: finalContent }).catch(() => {});

        if (isFinalRound) {
            const fData = player(winner.id);
            fData.coins += 25; fData.wins += 1; update(winner.id, fData);

            const winEmbed = new EmbedBuilder()
                .setColor("#FFD700")
                .setTitle("👑 البطل النهائي 👑")
                .setDescription(
`🥇 **الفائز:** <@${winner.id}>
💰 **الجائزة:** \`+25\` كوينز!
📊 **مجموع الانتصارات:** \`${fData.wins}\` فوز.`
                )
                .setThumbnail(winner.displayAvatarURL({ size: 128, dynamic: true }));

            await channel.send({ embeds: [winEmbed] });
            break; 
        }

        const targets = playersInGame.filter(p => p.id !== winner.id);
        const rows = [];
        let currentRow = new ActionRowBuilder();
        
        targets.forEach((p, index) => {
            if (index > 0 && index % 3 === 0) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }
            currentRow.addComponents(
                new ButtonBuilder().setCustomId(`kick_${p.id}`).setLabel(`${p.displayName}`).setStyle(ButtonStyle.Secondary)
            );
        });
        if (currentRow.components.length > 0) rows.push(currentRow);

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`kick_random`).setLabel("عشوائي 🎲").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`kick_leave`).setLabel("انسحاب 🏳️").setStyle(ButtonStyle.Secondary)
        );
        rows.push(actionRow);

        const msg = await channel.send({ content: `اختر من الأسفل:`, components: rows });

        let collected;
        try {
            collected = await msg.awaitMessageComponent({
                filter: i => i.user.id === winner.id,
                componentType: ComponentType.Button,
                time: 15000 
            });
        } catch (err) {
            // تعطيل الأزرار بدلاً من حذفها عند انتهاء الوقت
            const disabledRows = msg.components.map(row => ActionRowBuilder.from(row).setComponents(row.components.map(c => ButtonBuilder.from(c).setDisabled(true))));
            await msg.edit({ components: disabledRows }).catch(() => {});
            
            playersInGame = playersInGame.filter(p => p.id !== winner.id);
            await channel.send({ content: `⚠️ | تم طرد <@${winner.id}> من اللعبة لعدم التفاعل ، ستبدأ الجولة التالية بعد قليل...` });
            await new Promise(resolve => setTimeout(resolve, 400));
            continue;
        }

        // تعطيل الأزرار بدلاً من حذفها عند اختيار قرار
        const disabledRows = msg.components.map(row => ActionRowBuilder.from(row).setComponents(row.components.map(c => ButtonBuilder.from(c).setDisabled(true))));
        await collected.update({ components: disabledRows });

        let targetId;
        let isRandom = false;

        if (collected.customId === "kick_random") {
            const randomTarget = targets[Math.floor(Math.random() * targets.length)];
            targetId = randomTarget.id;
            isRandom = true; 
        } 
        else if (collected.customId === "kick_leave") {
            playersInGame = playersInGame.filter(p => p.id !== winner.id);
            await channel.send({ content: `🏳️ | قرر <@${winner.id}> الانسحاب و خرج من اللعبة، ستبدأ الجولة التالية بعد قليل...` });
            await new Promise(resolve => setTimeout(resolve, 400));
            continue;
        } 
        else {
            targetId = collected.customId.split("_")[1];
        }

        let targetData = player(targetId);

        if (targetData.shield > 0) {
            targetData.shield = 0; update(targetId, targetData);
            await channel.send({ content: `🛡️ | حاول <@${winner.id}> طرد <@${targetId}> ولكنه نجا بفضل خاصية الحماية` });
            await new Promise(resolve => setTimeout(resolve, 400));
            continue;
        }

        if (targetData.reflect > 0) {
            targetData.reflect = 0; update(targetId, targetData);
            playersInGame = playersInGame.filter(p => p.id !== winner.id);
            await channel.send({ content: `🔁 | حاول <@${winner.id}> طرد <@${targetId}> ولكن ارتدت عليه الهجمة و تم طرده` });
            await new Promise(resolve => setTimeout(resolve, 400));
            continue;
        }

        playersInGame = playersInGame.filter(p => p.id !== targetId);
        
        const pData = player(winner.id);
        pData.xp += 50;
        if (pData.xp >= pData.level * 150) { pData.level++; pData.xp = 0; } 
        update(winner.id, pData);

        if (isRandom) {
            await channel.send({ content: `🎲 | تم طرد <@${targetId}> من اللعبة بشكل عشوائي، ستبدأ الجولة التالية بعد قليل...` });
        } else {
            await channel.send({ content: `💣 | تم طرد <@${targetId}> من اللعبة، ستبدأ الجولة التالية بعد قليل...` });
        }
        await new Promise(resolve => setTimeout(resolve, 400));
    }

    gameManager.deleteGame(channel.id);
    gameManager.unlock(channel.id);
}
/* =========================
    🎮 BOT COMMANDS HANDLER
========================= */
client.once("ready", () => { console.log(`🌍 BOT RUNNING PRO AS ${client.user.tag}`); });

client.on("messageCreate", async (m) => {
    if (m.author.bot || !m.guild || !m.content.startsWith(PREFIX)) return;

    const args = m.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (['اعلام', 'اسرع', 'روليت'].includes(command)) {
        const hasPermission = m.member.roles.cache.some(role => ALLOWED_ROLES.includes(role.name));
        if (!hasPermission) {
            return m.reply("❌ عذراً، هذا الأمر مخصص فقط لإداريي السيرفر والمسؤولين!");
        }
    }

    const isRouletteLocked = gameManager.isLocked(m.channel.id);
    if (['اعلام', 'اسرع', 'روليت'].includes(command)) {
        if (isGameRunning || isRouletteLocked) {
            return m.reply("❌ هناك لعبة مشتعلة حالياً في هذه القناة! لا يمكنك تشغيل لعبة أخرى حتى تنتهي الجولة الأولى تماماً.");
        }
    }

    // ==========================================
    // 🎮 لعبة الأعلام (+اعلام)
    // ==========================================
    if (command === 'اعلام') {
        isGameRunning = true;

        const setupEmbed = new EmbedBuilder()
            .setTitle('⚙️ اختيار مستوى اللعبة ⚙️')
            .setDescription('**الرجاء تحديد مستوى الصعوبة عن طريق كتابة الكلمة في الشات:**\n\n🔹 `سهل`\n🔸 `متوسط`\n🔻 `صعب`')
            .setColor('#f39c12');

        await m.channel.send({ embeds: [setupEmbed] });

        const difficultyFilter = (msg) => msg.author.id === m.author.id && ['سهل', 'متوسط', 'صعب'].includes(msg.content.trim());
        const difficultyCollector = m.channel.createMessageCollector({ filter: difficultyFilter, time: 15000, max: 1 });

        difficultyCollector.on('collect', async (difficultyMessage) => {
            const selectedDifficulty = difficultyMessage.content.trim();
            const flagsList = FLAGS_BY_DIFFICULTY[selectedDifficulty];
            const chosenFlag = flagsList[Math.floor(Math.random() * flagsList.length)];
            const correctNotification = chosenFlag.name;

            const gameEmbed = new EmbedBuilder()
                .setTitle(`🎯 لعبة الأعلام (${selectedDifficulty}) 🎯`)
                .setDescription('**ما هذا العلم؟** 🤔\n\nأسرع شخص يكتب الاسم الصحيح هو الفائز!')
                .setColor('#3498db')
                .setImage(chosenFlag.image);

            await m.channel.send({ embeds: [gameEmbed] });

            const answerFilter = (msg) => msg.channel.id === m.channel.id && normalizeText(msg.content) === normalizeText(correctNotification);
            const answerCollector = m.channel.createMessageCollector({ filter: answerFilter, time: 30000, max: 1 });

            answerCollector.on('collect', async (winnerMessage) => {
                const successEmbed = new EmbedBuilder()
                    .setTitle('🎉 فائز جديد! 🎉')
                    .setDescription(`كفو! الإجابة الصحيحة هي **${correctNotification}**\n\nالفائز هو: ${winnerMessage.author}`)
                    .setColor('#2ecc71');
                
                await m.channel.send({ embeds: [successEmbed] });
                isGameRunning = false; 
            });

            answerCollector.on('end', async (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setTitle('⏱️ انتهى الوقت! ⏱️')
                        .setDescription(`للأسف ما حد عرف الإجابة الصحيحة.\n\nالعلم كان لـ: **${correctNotification}** 🏳️`)
                        .setColor('#e74c3c');
                    
                    await m.channel.send({ embeds: [timeoutEmbed] });
                    isGameRunning = false; 
                }
            });
        });

        difficultyCollector.on('end', async (collected) => {
            if (collected.size === 0) {
                await m.channel.send('⏱️ تم إلغاء الأمر لعدم اختيار مستوى الصعوبة في الوقت المحدد.');
                isGameRunning = false; 
            }
        });
    }

    // ==========================================
    // ⚡ لعبة أسرع كتابة المحدثة (+اسرع)
    // ==========================================
    if (command === 'اسرع') {
        isGameRunning = true; 

        const choiceEmbed = new EmbedBuilder()
            .setTitle('⚡ اختيار نمط السرعة ⚡')
            .setDescription('اختر النمط المفضل لبدء التحدي:')
            .setColor('#9b59b6');

        const choiceRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("speed_word").setLabel("كلمة 📝").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("speed_sentence").setLabel("جملة قصيرة 📜").setStyle(ButtonStyle.Secondary)
        );

        const choiceMsg = await m.channel.send({ embeds: [choiceEmbed], components: [choiceRow] });

        const choiceCollector = choiceMsg.createMessageComponentCollector({ 
            componentType: ComponentType.Button, 
            time: 15000, 
            max: 1 
        });

        choiceCollector.on('collect', async (i) => {
            const isWord = i.customId === "speed_word";
            
            const chosenText = isWord 
                ? SPEED_WORDS[Math.floor(Math.random() * SPEED_WORDS.length)]
                : SPEED_SENTENCES[Math.floor(Math.random() * SPEED_SENTENCES.length)];

            await i.update({ content: `🏁 **اكتب النص التالي بأسرع ما يمكن:**\n\`\`\`\n${chosenText}\n\`\`\``, embeds: [], components: [] });

            const speedFilter = (msg) => msg.channel.id === i.channel.id && normalizeText(msg.content) === normalizeText(chosenText);
            const gameCollector = i.channel.createMessageCollector({ filter: speedFilter, time: 20000, max: 1 });

            gameCollector.on('collect', async (winnerMessage) => {
                const winMsgEmbed = new EmbedBuilder()
                    .setTitle('🥇 صاروخ الشات! 🥇')
                    .setDescription(`كفو والله! كتبت الإجابة بسرعة البرق 🚀\n\nالفائز: ${winnerMessage.author}`)
                    .setColor('#2ecc71');

                await m.channel.send({ embeds: [winMsgEmbed] });
                isGameRunning = false;
            });

            gameCollector.on('end', async (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    await m.channel.send(`⏱️ انتهى وقت التحدي! لم يكتب أحد النص بالوقت المحدد. النص كان: (**${chosenText}**)`);
                    isGameRunning = false;
                }
            });
        });

        choiceCollector.on('end', async (collected) => {
            if (collected.size === 0) {
                await choiceMsg.delete().catch(() => {});
                await m.channel.send("⏱️ تم إلغاء تحدي السرعة لعدم اختيار النمط في الوقت المحدد.");
                isGameRunning = false;
            }
        });
    }

    // ==========================================
    // 🎡 لعبة الروليت التلقائية (+روليت)
    // ==========================================
    if (command === "روليت") {
        gameManager.lock(m.channel.id);
        gameManager.createGame(m.channel.id, m.author.id, null);
        const game = gameManager.getGame(m.channel.id);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("join_game").setLabel("دخول ➕").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("leave_game").setLabel("خروج ➖").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("open_shop").setLabel("المتجر 🏪").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("open_inventory").setLabel("الحقيبة 💼").setStyle(ButtonStyle.Secondary)
        );

        let timeLeft = 60;
        
       const lobbyFile = new AttachmentBuilder('./lobby.gif');

    const signupMsg = await m.channel.send({
        content: `⏳ **الوقت المتبقي:** \`${timeLeft}\` ثانية | 👥 **اللاعبين:** \`${game.players.length}\``,
        components: [row],
        files: [lobbyFile]
    });
        game.messageId = signupMsg.id;

        const countdownInterval = setInterval(async () => {
            timeLeft -= 5;
            if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            await signupMsg.edit({ content: `🔒 **انتهى وقت التسجيل! تبدأ جولة الروليت الآن...**`, components: [] }).catch(() => {});
        } else {
            const currentGame = gameManager.getGame(m.channel.id);
            const count = currentGame ? currentGame.players.length : 0;
            await signupMsg.edit({ content: `⏳ **الوقت المتبقي:** \`${timeLeft}\` ثانية | 👥 **اللاعبين:** \`${count}\`` }).catch(() => {});
        }
        }, 5000);

        const collector = signupMsg.createMessageComponentCollector({ time: 60000 });

        collector.on("collect", async (i) => {
            if (i.customId === "join_game") {
                const added = gameManager.addPlayer(m.channel.id, i.user);
                if (!added) return i.reply({ content: "⚠️ أنت مسجل بالفعل أو اللعبة ممتلئة!", ephemeral: true });
                await i.reply({ content: "✅ تم تسجيل دخولك بنجاح في جولة الروليت!", ephemeral: true });
            }

            const updatedGame = gameManager.getGame(m.channel.id);
        if (updatedGame) {
            signupMsg.edit({ content: `⏳ **الوقت المتبقي:** \`${timeLeft}\` ثانية | 👥 **اللاعبين:** \`${updatedGame.players.length}\`` }).catch(() => {});
        }

            if (i.customId === "leave_game") {
                const liveGame = gameManager.getGame(m.channel.id);
                if (liveGame) {
                    const initialCount = liveGame.players.length;
                    liveGame.players = liveGame.players.filter(p => p.id !== i.user.id);
                    if (liveGame.players.length < initialCount) {
                        return i.reply({ content: "🚪 تم خروجك من الروليت بنجاح.", ephemeral: true });
                    }
                }

const updatedGame = gameManager.getGame(m.channel.id);
        if (updatedGame) {
            signupMsg.edit({ content: `⏳ **الوقت المتبقي:** \`${timeLeft}\` ثانية | 👥 **اللاعبين:** \`${updatedGame.players.length}\`` }).catch(() => {});
        }

                await i.reply({ content: "⚠️ أنت لست مسجلاً بالأساس في هذه الجولة!", ephemeral: true });
            }

            if (i.customId === "open_shop") {
                const pData = player(i.user.id);
                const shopEmbed = gameManager.buildShopEmbed(pData.coins);

                const shopRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`buyshield_${i.user.id}`).setLabel("شراء حماية 🛡️ (60 كوينز)").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`buyreflect_${i.user.id}`).setLabel("شراء مرتدة 🔁 (80 كوينز)").setStyle(ButtonStyle.Secondary)
                );

                const shopMsg = await i.reply({ embeds: [shopEmbed], components: [shopRow], ephemeral: true, fetchReply: true });
                const shopCollector = shopMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

                shopCollector.on("collect", async (buttonInteraction) => {
                    const isShield = buttonInteraction.customId.startsWith("buyshield_");
                    const buyerId = buttonInteraction.customId.split("_")[1];
                    if (buttonInteraction.user.id !== buyerId) return buttonInteraction.reply({ content: "❌ هذا المتجر ليس لك!", ephemeral: true });

                    let currentPlayerData = player(buttonInteraction.user.id);

                    if (isShield) {
                        if (currentPlayerData.shield > 0) return buttonInteraction.update({ content: "⚠️ أنت تمتلك حماية مفعلة بالفعل لهذا القيم!", embeds: [], components: [] });
                        if (currentPlayerData.coins < 60) return buttonInteraction.update({ content: "❌ لا تمتلك كوينز كافية لشراء الحماية!", embeds: [], components: [] });
                        currentPlayerData.coins -= 60; currentPlayerData.shield = 1; update(buttonInteraction.user.id, currentPlayerData);
                        await buttonInteraction.update({ content: "✅ تم شراء خاصية **الحماية 🛡️** بنجاح!", embeds: [], components: [] });
                    } else {
                        if (currentPlayerData.reflect > 0) return buttonInteraction.update({ content: "⚠️ أنت تمتلك مرتدة مفعلة بالفعل لهذا القيم!", embeds: [], components: [] });
                        if (currentPlayerData.coins < 80) return buttonInteraction.update({ content: "❌ لا تمتلك كوينز كافية لشراء المرتدة!", embeds: [], components: [] });
                        currentPlayerData.coins -= 80; currentPlayerData.reflect = 1; update(buttonInteraction.user.id, currentPlayerData);
                        await buttonInteraction.update({ content: "✅ تم شراء خاصية **المرتدة 🔁** بنجاح!", embeds: [], components: [] });
                    }
                });
            }

            if (i.customId === "open_inventory") {
                const pData = player(i.user.id);
                const invEmbed = new EmbedBuilder()
                    .setColor("#34495E")
                    .setTitle("💼 حقيبتك وممتلكاتك الحالية")
                    .setDescription(`أهلاً بك <@${i.user.id}>، إليك ممتلكاتك النشطة في الخادم حالياً:`)
                    .addFields(
                        { name: "💰 رصيد الكوينز", value: `\`${pData.coins}\` كوينز`, inline: true },
                        { name: "🛡️ درع الحماية", value: pData.shield > 0 ? "متوفر ومفعّل ✅" : "غير متاح ❌", inline: true },
                        { name: "🔁 ضربة مرتدة", value: pData.reflect > 0 ? "متوفرة ومفعّلة ✅" : "غير متاحة ❌", inline: true }
                    );
                await i.reply({ embeds: [invEmbed], ephemeral: true });
            }
        });

        collector.on("end", async () => {
            clearInterval(countdownInterval);
            const finalGame = gameManager.getGame(m.channel.id);
            if (!finalGame || finalGame.players.length < 2) {
                gameManager.deleteGame(m.channel.id);
                gameManager.unlock(m.channel.id);
                return m.channel.send("❌ تم إلغاء جولة الروليت لعدم اكتمال عدد اللاعبين (لاعبين أو أكثر).");
        }

        
          startMatch(m.channel);
    });
    }

    // ==========================================
    // 👤 بروفايل اللاعب (+profile)
    // ==========================================
    if (command === "profile") {
        const p = player(m.author.id);
        const profileEmbed = new EmbedBuilder()
            .setColor("#3498DB")
            .setThumbnail(m.author.displayAvatarURL())
            .setTitle(`👤 ملف لاعب: ${m.author.displayName}`)
            .addFields(
                { name: "💰 الرصيد", value: `${p.coins} كوينز`, inline: true },
                { name: "📊 المستوى (LVL)", value: `${p.level}`, inline: true },
                { name: "🏆 الانتصارات", value: `${p.wins} فوز`, inline: true },
                { name: "🛡️ حماية نشطة", value: p.shield > 0 ? "نعم ✅" : "لا ❌", inline: true },
                { name: "🔁 مرتدة نشطة", value: p.reflect > 0 ? "نعم ✅" : "لا ❌", inline: true }
            );
        return m.channel.send({ embeds: [profileEmbed] });
    }
});

client.login(process.env.TOKEN);