const fs = require('fs');

module.exports = (bot) => {
    const fileNamesWithProbabilities = [
        { filePath: './src/menu_1.jpg', probability: 57 }
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
                        { text: 'Menu De Descarga', callback_data: 'menudedescarga' },
                        { text: 'Menu Premium', callback_data: 'menupremium' }
                    ],
                    [
                        { text: 'Menu IA', callback_data: 'menuia' },
                        { text: 'Menu +18', callback_data: 'menu+18' }
                    ],
                    [
                        { text: 'Menu2', callback_data: 'menu2' },
                        { text: 'Creador', callback_data: 'creador' }
                    ]
                ]
            }
        };
        const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
        const caption = `
        ╔═════⪼∞⪻═════╗
║✎ Menu 
╚═════⪼∞⪻═════╝
╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄≫
┆➭『Hola  *${username}*』
┆ Bienvenid@ A El
┆
┆ Bot: MultiversoBot-TG
┆ Versión: beta 1.0.0
┆
┆ 
╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄≫
📝Nota:
Precione Un Menú 
De Los Botones
*${username}*
Info Extra
[GitHud](https://github.com/Galaxia-Gaming-Studios)
[Canal De Telegram](https://t.me/+_Fr9umAoRr0wMjgx)
[Canal De WhatsApp](https://whatsapp.com/channel/0029VaygcHqKWEKz15BwV808)
[Mi Repositorio BB](https://github.com/Galaxia-Gaming-Studios/MultiversoBot-TG.git)
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

    bot.command('menu', async (ctx) => {
        await sendMedia(ctx);
    });

    bot.action('menu', async (ctx) => {
        await sendMedia(ctx);
    });
};