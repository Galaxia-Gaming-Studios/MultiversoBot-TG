const fs = require('fs');
const moment = require('moment-timezone');

// Función para leer la zona horaria del usuario desde zonahoraria.json
function getUserZonaHoraria(userId) {
    const path = './database/zonahoraria.json';
    if (!fs.existsSync(path)) return null;

    const data = fs.readFileSync(path, 'utf8');
    const zonas = JSON.parse(data);
    const user = zonas.find(user => user.ID === userId);
    return user ? user.zona_horaria : null;
}

// Función para seleccionar un archivo basado en probabilidades
function selectFileWithProbability() {
    const fileNamesWithProbabilities = [
        { filePath: './src/menu_1.jpg', probability: 50 },
        { filePath: './src/menu_2.mp4', probability: 80 },
        { filePath: './src/menu_3.mp4', probability: 70 },
        { filePath: './src/menu_4.mp4', probability: 60 },
        { filePath: './src/menu_5.mp4', probability: 90 }
    ];

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

// Función para generar el saludo según la hora
function ucapan(userId) {
    const defaultTimezone = "America/Managua";
    const userTimezone = getUserZonaHoraria(userId) || defaultTimezone;

    const time = moment.tz(userTimezone).format("HH");
    let res = "🌉 ¡Hora de soñar un poquito más!";

    if (time >= 7 && time < 11) {
        res = "🌅 *¡Buenos Días!* ¡Que tengas un gran desayuno! 🤤";
    } else if (time >= 11 && time < 12) {
        res = "🌞 *¡Buen Mediodía!* ¡Disfruta tu almuerzo!";
    } else if (time >= 12 && time < 18) {
        res = "🍽️ *¡Buenas Tardes!* ¡Aprovecha la tarde!";
    } else if (time >= 18 && time < 21) {
        res = "🌇 *¡Atardecer de campeones!* ¡Sigue adelante! 💥";
    } else if (time >= 21 || time < 4) {
        res = "🌌 *¡Hora de descansar!* ¡Recarga energías para mañana! 😴✨";
    } else if (time >= 4 && time < 7) {
        res = "🌙 *¡Madrugada!* ¡Aprovecha la tranquilidad!";
    }

    return res;
}

// Función para obtener el tiempo de actividad del bot
function getBotUptime() {
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    return `${days}d:${hours}h:${minutes}m:${seconds}s`;
}

// Función para enviar el archivo multimedia con el menú
async function sendMedia(ctx) {
    const filePath = selectFileWithProbability();
    const userId = ctx.from.id;
    const saludo = ucapan(userId);
    const uptime = getBotUptime();
    const messageId = ctx.message ? ctx.message.message_id : ctx.callbackQuery.message.message_id;

    // Obtener datos de fecha, hora y región
    const userTimezone = getUserZonaHoraria(userId) || "America/Managua";
    const now = moment().tz(userTimezone);
    const fecha = now.format("dddd, D [de] MMMM [de] YYYY");
    const hora = now.format("h:mm:ss a").toUpperCase();
    const region = userTimezone.split('/').pop().replace(/_/g, ' ').toUpperCase();

    if (!filePath) return ctx.reply('No se encontró ningún archivo multimedia válido.', { reply_to_message_id: messageId });

    const isVideo = filePath.endsWith('.mp4');
    const isGif = filePath.endsWith('.gif');
    const buttons = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🎧Descargas📼', callback_data: 'menu_descargas' },
                    { text: '💻IA📱', callback_data: 'menu_ia' }
                ],
                [
                    { text: '⚙️On/Off🛠️', callback_data: 'menu_on_off' },
                    { text: '🛠️Owner🎟️', callback_data: 'memu_owner' }
                ],
                [
                    { text: 'Nada no se falta', callback_data: 'nada' },
                    { text: '💾Colaboradores💻', callback_data: 'Colaboradores' }
                ]
            ]
        }
    };

    const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
    const caption = `
╔╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╗
╏✎ *Menu Principal*
╚╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╝
╭╌≪*MultiversoBot-TG*≫╌╮
╎📅 Fecha: *${fecha}*
╎🕒 Hora: *${hora}*
╎❒『*Hola Bienvenid@*』
╎ ${saludo}
╎➭ ${username} 👋
╎
╎
╎➮ 🏳️ Région: *${region}*
╎ツ
╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯

_❏ 📝Nota:_
_Presione un menú_
_de los botones_
_para acceder a las funciones_
`;

    try {
        if (isVideo) {
            await ctx.replyWithVideo({ source: filePath }, { caption, parse_mode: 'Markdown', reply_to_message_id: messageId, ...buttons });
        } else if (isGif) {
            await ctx.replyWithAnimation({ source: filePath }, { caption, parse_mode: 'Markdown', reply_to_message_id: messageId, ...buttons });
        } else {
            await ctx.replyWithPhoto({ source: filePath }, { caption, parse_mode: 'Markdown', reply_to_message_id: messageId, ...buttons });
        }
    } catch (error) {
        console.error('Error al enviar el archivo multimedia:', error);
        ctx.reply('Hubo un error al enviar el archivo multimedia.', { reply_to_message_id: messageId });
    }
}

module.exports = (bot) => {
    // Comando /menu
    bot.command('menu', async (ctx) => {
        await sendMedia(ctx);
    });

    // Acción del menú
    bot.action('menu', async (ctx) => {
        await sendMedia(ctx);
    });
};