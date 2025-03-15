const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// Configuración de rutas
const DB_PATH = path.join(__dirname, '..', 'database', 'reg.json');

// Función para cargar usuarios
function loadUsers() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
            fs.writeFileSync(DB_PATH, '[]');
        }
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        return [];
    }
}

function getBotUptime() {
    const seconds = process.uptime();
    return [
        Math.floor(seconds / 86400) + 'd',
        Math.floor((seconds % 86400) / 3600) + 'h',
        Math.floor((seconds % 3600) / 60) + 'm',
        Math.floor(seconds % 60) + 's'
    ].join(' : ');
}

function selectFileWithProbability() {
    // ... (tu implementación existente)
}

async function sendMedia(ctx) {
    try {
        const users = loadUsers();
        const user = users.find(u => u.id_telegram === ctx.from.id);
        
        if (!user) {
            return ctx.reply('⚠️ Primero regístrate con /reg', {
                reply_to_message_id: ctx.message.message_id,
                parse_mode: 'Markdown'
            });
        }

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

        const options = {
            parse_mode: 'Markdown',
            reply_to_message_id: ctx.message?.message_id,
            ...buttons
        };

        if (filePath) {
            if (filePath.endsWith('.mp4')) {
                await ctx.replyWithVideo({ source: filePath }, { caption, ...options });
            } else {
                await ctx.replyWithPhoto({ source: filePath }, { caption, ...options });
            }
        } else {
            await ctx.reply(caption, options);
        }

    } catch (error) {
        console.error('Error en menú:', error);
        ctx.reply('❌ Error al mostrar el menú', {
            reply_to_message_id: ctx.message?.message_id
        });
    }
}

module.exports = (bot) => {
    bot.command('menurpg', async (ctx) => await sendMedia(ctx));
    bot.action('menu_rpg', async (ctx) => await sendMedia(ctx));
};

bot.handler.register = true;