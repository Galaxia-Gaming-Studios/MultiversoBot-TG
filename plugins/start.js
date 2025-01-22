const fs = require('fs');

module.exports = (bot) => {
    const fileNamesWithProbabilities = [
        { filePath: '../src/menu_1.jpg', probability: 57 }
    ];

    function selectFileWithProbability() {
        const validFiles = fileNamesWithProbabilities.filter(file => fs.existsSync(file.filePath));
        if (validFiles.length === 0) return null;
        if (validFiles.length === 1) return validFiles[0].filePath;
        const totalProbability = validFiles.reduce((sum, file) => sum + file.probability, 0);
        const random = Math.random() * totalProbability;
        let cumulativeProbability = 0;
        for (const file of validFiles) {
            cumulativeProbability += file.probability;
            if (random <= cumulativeProbability) return file.filePath;
        }
        return validFiles[0].filePath;
    }

    async function sendMedia(ctx) {
        const filePath = selectFileWithProbability();
        if (!filePath) return ctx.reply('No se encontró ningún archivo multimedia válido.');
        const isVideo = filePath.endsWith('.mp4');
        const isGif = filePath.endsWith('.gif');
        const buttons = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '💚Whatsapp', url: 'https://whatsapp.com/channel/0029VaygcHqKWEKz15BwV808' },
                        { text: '🩵Telegram', url: '' }
                    ],
                                        [
                        { text: 'GitHub', url: 'https://github.com/Galaxia-Gaming-Studios/MultiversoBot-TG.git' },
                        { text: 'Soporte Técnico', url: 'https://wa.me/50671422452?text=Hola...%0A' }
                    ],
                    [
                        { text: 'Grupo Oficial', url: 'nada' },
                        { text: 'HostingPY', url: 'https://whatsapp.com/channel/0029Vak4e1R4NVifmh8Tvi3q' }
                    ],
                    [
                        { text: '🚀Menu🚀', callback_data: 'menu' },
                    ]
                ]
            }
        };
        const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
        const caption = `
╔══════════════
║ Bienvenid@
╚══════════════
╔╍╍╍╍╍╍╍╍╍╍╍╍╍╍
╏『Hola』
╏『*${username}*』
╏
╚╍╍╍╍╍╍╍╍╍╍╍╍╍╍
¡Hola👋! Te presento a **MultiversoBot-TG**✨, un nuevo bot de 
Telegram que hará tu experiencia
más divertida y emocionante🚀.
¡Prepárate para explorar un mundo lleno de sorpresas🌟 y aventuras🎉!
¡Únete a la diversión y descubre todo
lo que tenemos para ofrecerte! 🎈
¡Entendido! Aquí tienes la descripción ajustada:

🌟 **Nota 📒:** Para más información, presiona el botón de **Menú** 🥳. 

✅ **Sígueme en:*
**Canal de Telegram* 📲
*WhatsApp** 💬
*Mi repositorio de GitHub* 🖥️

¡Explora todo lo que tengo preparado para ti! 🎉

        `;

        try {
            const messageId = ctx.message ? ctx.message.message_id : ctx.callbackQuery.message.message_id;
            if (isVideo) {
                await ctx.replyWithVideo({ source: filePath }, { caption, parse_mode: 'Markdown', reply_to_message_id: messageId, ...buttons });
            } else if (isGif) {
                await ctx.replyWithAnimation({ source: filePath }, { caption, parse_mode: 'Markdown', reply_to_message_id: messageId, ...buttons });
            } else {
                await ctx.replyWithPhoto({ source: filePath }, { caption, parse_mode: 'Markdown', reply_to_message_id: messageId, ...buttons });
            }
        } catch (error) {
            console.error('Error al enviar el archivo multimedia:', error);
            const messageId = ctx.message ? ctx.message.message_id : ctx.callbackQuery.message.message_id;
            ctx.reply('Hubo un error al enviar el archivo multimedia.', { reply_to_message_id: messageId });
        }
    }

    bot.command('start', async (ctx) => {
        await sendMedia(ctx);
    });

    bot.action('start', async (ctx) => {
        await sendMedia(ctx);
    });
};