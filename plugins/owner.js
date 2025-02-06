const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// Configurar paths importantes
const DATABASE_DIR = './database';
const OWNER_DB_PATH = path.join(DATABASE_DIR, 'owner.json');
const TOKEN_PATH = './config/token.json';

// Asegurar que exista el directorio de la base de datos
if (!fs.existsSync(DATABASE_DIR)) {
    fs.mkdirSync(DATABASE_DIR, { recursive: true });
}

// Funciones comunes integradas directamente
function getUserZonaHoraria(userId) {
    const zonaPath = path.join(DATABASE_DIR, 'zonahoraria.json');
    if (!fs.existsSync(zonaPath)) return null;
    
    const data = fs.readFileSync(zonaPath, 'utf8');
    const zonas = JSON.parse(data);
    const user = zonas.find(u => u.ID === userId);
    return user ? user.zona_horaria : null;
}

function ucapan(userId) {
    const defaultTimezone = "America/Managua";
    const userTimezone = getUserZonaHoraria(userId) || defaultTimezone;
    const time = moment.tz(userTimezone).format("HH");
    
    if (time >= 7 && time < 11) return "🌅 *¡Buenos Días!* ¡Que tengas un gran desayuno! 🤤";
    if (time >= 11 && time < 12) return "🌞 *¡Buen Mediodía!* ¡Disfruta tu almuerzo!";
    if (time >= 12 && time < 18) return "🍽️ *¡Buenas Tardes!* ¡Aprovecha la tarde!";
    if (time >= 18 && time < 21) return "🌇 *¡Atardecer de campeones!* ¡Sigue adelante! 💥";
    if (time >= 21 || time < 4) return "🌌 *¡Hora de descansar!* ¡Recarga energías para mañana! 😴✨";
    if (time >= 4 && time < 7) return "🌙 *¡Madrugada!* ¡Aprovecha la tranquilidad!";
    return "🌉 ¡Hora de soñar un poquito más!";
}

function getBotUptime() {
    const uptime = process.uptime();
    return new Date(uptime * 1000).toISOString().substr(11, 8);
}

// Funciones para manejar owner.json
function getOwners() {
    if (!fs.existsSync(OWNER_DB_PATH)) {
        fs.writeFileSync(OWNER_DB_PATH, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(OWNER_DB_PATH, 'utf8'));
}

function saveOwners(data) {
    fs.writeFileSync(OWNER_DB_PATH, JSON.stringify(data, null, 2));
}

// Formato de verificación
function formatOwnerPanel(ctx) {
    const userId = ctx.from.id;
    const userTimezone = getUserZonaHoraria(userId) || "America/Managua";
    const now = moment().tz(userTimezone);
    
    return `
╔╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╗
╏✎ *Verificación*
╚╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╝
╭╌≪*MultiversoBot-TG*≫╌╮
╎📅 Fecha: *${now.format("dddd, D [de] MMMM [de] YYYY")}*
╎🕒 Hora: *${now.format("h:mm:ss a").toUpperCase()}*
╎❒『*Hola Bienvenid@ Owner*』
╎ ${ucapan(userId)}
╎➭ ${ctx.from.first_name} 👋
╎
╎⏱️ *Uptime:* ${getBotUptime()}
╎➮ 🏳️ Région: *${userTimezone.split('/')[1].replace(/_/g, ' ').toUpperCase()}*
╎ツ
╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯
    `.trim();
}

module.exports = (bot) => {
    // Comando /owner
    bot.command('owner', async (ctx) => {
        const [command, token] = ctx.message.text.split(' ');
        if (!token) return ctx.reply('🔑 Proporciona el token del bot');
        
        try {
            const validToken = JSON.parse(fs.readFileSync(TOKEN_PATH)).token;
            if (token !== validToken) {
                const warning = ctx.chat.type === 'private' 
                    ? '❌ *Token incorrecto*' 
                    : '⚠️ Realiza esta acción en privado';
                return ctx.reply(warning, { parse_mode: 'Markdown' });
            }

            const owners = getOwners();
            owners.owner0 = {
                nombre: ctx.from.first_name,
                username: ctx.from.username || 'N/A',
                ID: ctx.from.id,
                fecha: moment().format(),
                región: getUserZonaHoraria(ctx.from.id)
            };
            saveOwners(owners);

            ctx.replyWithMarkdown(formatOwnerPanel(ctx));
            
        } catch (error) {
            console.error('Error en comando /owner:', error);
            ctx.reply('🚨 Error en la verificación');
        }
    });

    // Comandos owner1 - owner10
    for (let i = 1; i <= 10; i++) {
        bot.command(`owner${i}`, async (ctx) => {
            const owners = getOwners();
            if (!owners.owner0 || ctx.from.id !== owners.owner0.ID) {
                return ctx.reply('⛔ No tienes permisos para esto');
            }

            const mention = ctx.message.entities.find(e => e.type === 'text_mention');
            if (!mention) return ctx.reply('Debes mencionar un usuario');

            const user = mention.user;
            owners[`owner${i}`] = {
                nombre: user.first_name,
                username: user.username || 'N/A',
                ID: user.id,
                fecha: moment().format(),
                región: getUserZonaHoraria(user.id)
            };
            saveOwners(owners);

            ctx.reply(`✅ *Owner${i} asignado:* ${user.first_name}`, { 
                parse_mode: 'Markdown',
                reply_to_message_id: ctx.message.message_id
            });
        });
    }
};