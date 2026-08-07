const { EmbedBuilder } = require("discord.js");

const activeGames = new Map();
const channelLocks = new Set();

module.exports = {
    lock: (channelId) => channelLocks.add(channelId),
    unlock: (channelId) => channelLocks.delete(channelId),
    isLocked: (channelId) => channelLocks.has(channelId),

    createGame: (channelId, hostId, msgId) => {
        activeGames.set(channelId, {
            hostId,
            messageId: msgId,
            players: [],
            started: false
        });
    },

    getGame: (channelId) => activeGames.get(channelId),
    deleteGame: (channelId) => activeGames.delete(channelId),
    startGameFlag: (channelId) => {
        const g = activeGames.get(channelId);
        if (g) g.started = true;
    },

    addPlayer: (channelId, user) => {
        const game = activeGames.get(channelId);
        if (!game || game.started) return false;
        
        // ✅ تم تحديث الحد الأقصى هنا ليكون 150 لاعب بناءً على طلبك
        if (game.players.length >= 150) return false; 
        if (game.players.some(p => p.id === user.id)) return false;

        game.players.push(user);
        return true;
    },

    buildLobbyEmbed: (players, timeLeft, imageUrl) => {
        const playerList = players.length > 0 
            ? players.map((p, idx) => `**${idx + 1}.** <@${p.id}> (\`${p.displayName}\`)`).join("\n")
            : "⏳ في انتظار دخول الضحايا...";

        return new EmbedBuilder()
            .setColor("#F1C40F")
            .setTitle("🎯 إستعدوا لجولة الروليت الروسية - Russian Roulette")
            .setDescription(
`🔥 **قوانين الموت:** العجلة تدور وتختار الجلاد، والجلاد يملك السلاح ليختار ضحية واحدة ويقضي عليها فوراً عبر الأزرار الحمراء!

⏱️ **الوقت المتبقي لبدء الجولة:** \`${timeLeft}\` ثانية.
👥 **اللاعبين المسجلين حالياً (${players.length}/150):** ${playerList}`
            )
            .setImage(imageUrl) 
            .setFooter({ text: "تأكد من زيارة المتجر قبل بدء الجولة لشراء الدروع الحامية!" })
            .setTimestamp();
    },

    buildShopEmbed: (userCoins) => {
        return new EmbedBuilder()
            .setColor("#3498DB")
            .setTitle("🛒 متجر أدوات الروليت السرية")
            .setDescription(
`مرحباً بك في المتجر ! استخدم كوينزاتك بحكمة لتأمين نفسك في الجولة القادمة:

🛡️ **درع الحماية (60 كوينز):**
إذا اختارك الجلاد للإقصاء، سيتم تفعيل الدرع تلقائياً وتنجو من الموت لمرة واحدة!

🔁 **الموجة المرتدة (80 كوينز):**
إذا حاول الجلاد إقصاءك، ستعكس الرصاصة عليه فوراً ويتم إقصاء الجلاد بدلاً منك!

💰 **رصيدك الحالي:** \`${userCoins}\` كوينز.`
            )
            .setFooter({ text: "تنبيه: تنتهي صلاحية الأدوات بنهاية الجولة الحالية سواء تم تفعيلها أم لا." });
    }
};