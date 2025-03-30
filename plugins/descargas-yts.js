const axios = require('axios');

const searchYouTube = async (query) => {
    try {
        const response = await axios.get(`https://eliasar-yt-api.vercel.app/api/search/youtube?query=${encodeURIComponent(query)}`);
        return response.data.results.resultado;
    } catch (error) {
        console.error('Error al realizar la solicitud a la API:', error.message);
        throw new Error('No se pudo realizar la búsqueda.');
    }
};

module.exports = (bot) => {
    bot.command('yts', async (ctx) => {
        const msgId = ctx.message.message_id;
        const query = ctx.message.text.split(' ').slice(1).join(' ');
        if (!query) {
            return ctx.reply('Por favor, proporciona un término de búsqueda después del comando /yts.');
        }

        try {
            const results = await searchYouTube(query);
            if (!results || results.length === 0) {
                return ctx.reply('No se encontraron resultados.');
            }

            for (const result of results.slice(0, 5)) {
                await ctx.replyWithPhoto(result.thumbnail, {
                    caption: `
🎬 *Título:* ${result.title}
📅 *Subido hace:* ${result.uploaded}
⏳ *Duración:* ${result.duration}
👀 *Vistas:* ${result.views}
🔗 [Ver en YouTube](${result.url})
[Apis Rest De search](https://eliasar-yt-api.vercel.app/search)
`,
                    parse_mode: 'Markdown', reply_to_message_id: msgId
                });
                await new Promise(resolve => setTimeout(resolve, 5000)); // Espera de 5 segundos antes de enviar el siguiente resultado
            }
        } catch (error) {
            console.error('Error al procesar la búsqueda:', error.message);
            ctx.reply('Ocurrió un error al realizar la búsqueda. Por favor, intenta de nuevo más tarde.');
        }
    });
};