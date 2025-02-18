const moment = require('moment-timezone');
const { MongoClient } = require('mongodb');

const mongoClient = new MongoClient('mongodb://localhost:27017');
let db;

(async () => {
    try {
        await mongoClient.connect();
        db = mongoClient.db('rpg_bot');
    } catch (err) {
        console.error('Error MongoDB:', err);
    }
})();

function getBotUptime() {
    const seconds = process.uptime();
    return [
        Math.floor(seconds / 86400) + 'd',
        Math.floor((seconds % 86400) / 3600) + 'h',
        Math.floor((seconds % 3600) / 60) + 'm',
        Math.floor(seconds % 60) + 's'
    ].join(' : ');
}

async function sendMedia(ctx) {
    try {
        const user = await db.collection('users').findOne({ id_telegram: ctx.from.id });
        if (!user) return ctx.reply('⚠️ Primero regístrate con /reg');

        const filePath = selectFileWithProbability();
        const uptime = getBotUptime();
        const region = user.zona_horaria.split('/')[1].replace(/_/g, ' ');

        const caption = `
╔╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╗
╏✎ *『MENÚ RPG』*
╚╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╝
╔╌╌MuliversoBot-TG╌╼
╎
╎❒ Nombre: ${user.nombre_usuario}
╎✰ Edad: ${user.edad}
╎❍ Estado: ${user.estado_civil}
╎✎ Nivel: ${user.nivel}
╎✏ Trabajo: ${user.trabajo}
╎✐ XP: ${user.xp}
╎🪙 Tokens: ${user.tokens}
╎💎 Diamantes: ${user.diamantes}
╎💰 Oro: ${user.oro}
╎⏱ Bot Activo: ${uptime}
╎🌍 Region: ${region}
╚╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╼`;

        const buttons = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '⛏️ Minar', callback_data: 'minar' },
                        { text: '🏢 Trabajar', callback_data: 'trabajar' }
                    ],
                    [
                        { text: '💼 Inventario', callback_data: 'inventario' },
                        { text: '📈 Estadísticas', callback_data: 'estadisticas' }
                    ],
                    [
                        { text: '⚔️ Aventura', callback_data: 'aventura' },
                        { text: '🏆 Ranking', callback_data: 'ranking' }
                    ],
                    [
                        { text: '⚙️ Configuración', callback_data: 'configuracion' }
                    ]
                ]
            }
        };

        if (filePath) {
            if (filePath.endsWith('.mp4')) {
                await ctx.replyWithVideo({ source: filePath }, { caption, parse_mode: 'Markdown', ...buttons });
            } else {
                await ctx.replyWithPhoto({ source: filePath }, { caption, parse_mode: 'Markdown', ...buttons });
            }
        } else {
            await ctx.reply(caption, { parse_mode: 'Markdown', ...buttons });
        }

    } catch (error) {
        console.error('Error en menú:', error);
        ctx.reply('❌ Error al mostrar el menú');
    }
}

module.exports = (bot) => {
    bot.command('menurpg', async (ctx) => await sendMedia(ctx));
    bot.action('menu_rpg', async (ctx) => await sendMedia(ctx));
};
