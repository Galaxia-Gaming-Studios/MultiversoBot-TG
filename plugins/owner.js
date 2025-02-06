const fs = require('fs');
const moment = require('moment-timezone');

// Función para leer el token del bot desde token.json
function getBotToken() {
    const path = './config/token.json';
    if (!fs.existsSync(path)) return null;

    const data = fs.readFileSync(path, 'utf8');
    const token = JSON.parse(data);
    return token.token;
}

// Función para leer la información del owner desde owner.json
function getOwnerInfo() {
    const path = './database/owner.json';
    if (!fs.existsSync(path)) return null;

    const data = fs.readFileSync(path, 'utf8');
    return JSON.parse(data);
}

// Función para guardar la información del owner en owner.json
function saveOwnerInfo(ownerInfo) {
    const path = './database/owner.json';
    fs.writeFileSync(path, JSON.stringify(ownerInfo, null, 2), 'utf8');
}

// Función para verificar si el usuario es el owner
function isOwner(userId, token) {
    const botToken = getBotToken();
    if (token !== botToken) return false;

    const ownerInfo = getOwnerInfo();
    if (!ownerInfo) return false;

    return ownerInfo.owner.ID === userId;
}

// Función para agregar un nuevo owner
function addOwner(userId, username, mencion) {
    const ownerInfo = getOwnerInfo();
    if (!ownerInfo) return false;

    const newOwner = {
        nombre: username,
        mencion: mencion,
        ID: userId,
        fecha: moment().format("YYYY-MM-DD"),
        region: "America/Managua"
    };

    for (let i = 1; i <= 10; i++) {
        if (!ownerInfo[`owner${i}`]) {
            ownerInfo[`owner${i}`] = newOwner;
            saveOwnerInfo(ownerInfo);
            return true;
        }
    }

    return false;
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

// Función para generar el mensaje de verificación
function generateVerificationMessage(userId, username, token) {
    const userTimezone = "America/Managua";
    const now = moment().tz(userTimezone);
    const fecha = now.format("dddd, D [de] MMMM [de] YYYY");
    const hora = now.format("h:mm:ss a").toUpperCase();
    const region = userTimezone.split('/').pop().replace(/_/g, ' ').toUpperCase();
    const saludo = ucapan(userId);

    if (isOwner(userId, token)) {
        const filePath = selectFileWithProbability();
        if (filePath) {
            return {
                message: `
╔╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╗
╏✎ *Verificación exitosa*
╚╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╝
╭╌≪*MultiversoBot-TG*≫╌╮
╎📅 Fecha: *${fecha}*
╎🕒 Hora: *${hora}*
╎❒『*Hola Bienvenid@ Owner*』
╎ ${saludo}
╎➭ ${username} 👋
╎
╎
╎➮ 🏳️ Région: *${region}*
╎ツ
╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯
                `,
                filePath: filePath
            };
        } else {
            return {
                message: "Error: No se encontró ningún archivo multimedia válido."
            };
        }
    } else {
        return {
            message: "Error: Tu no eres mi owner. Te sugiero hacer la verificación en privado, no en grupo."
        };
    }
}

// Función para enviar el archivo multimedia con el menú
async function sendMedia(ctx, filePath, caption) {
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

    try {
        if (isVideo) {
            await ctx.replyWithVideo({ source: filePath }, { caption, parse_mode: 'Markdown', ...buttons });
        } else if (isGif) {
            await ctx.replyWithAnimation({ source: filePath }, { caption, parse_mode: 'Markdown', ...buttons });
        } else {
            await ctx.replyWithPhoto({ source: filePath }, { caption, parse_mode: 'Markdown', ...buttons });
        }
    } catch (error) {
        console.error('Error al enviar el archivo multimedia:', error);
        ctx.reply('Hubo un error al enviar el archivo multimedia.');
    }
}

module.exports = (bot) => {
    // Comando /owner
    bot.command('owner', async (ctx) => {
        const userId = ctx.from.id;
        const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
        const token = ctx.message.text.split(' ')[1];

        const verification = generateVerificationMessage(userId, username, token);
        if (verification.filePath) {
            await sendMedia(ctx, verification.filePath, verification.message);
        } else {
            ctx.reply(verification.message);
        }
    });

    // Comando /owner1 a /owner10
    for (let i = 1; i <= 10; i++) {
        bot.command(`owner${i}`, async (ctx) => {
            const userId = ctx.from.id;
            const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
            const mencion = ctx.message.text.split(' ')[1];

            if (mencion) {
                const success = addOwner(userId, username, mencion);
                if (success) {
                    ctx.reply(`Nuevo owner agregado: ${mencion}`);
                } else {
                    ctx.reply("No se pudo agregar el nuevo owner. Ya hay 10 owners registrados.");
                }
            } else {
                ctx.reply("Debes mencionar a un usuario para agregarlo como owner.");
            }
        });
    }
};
