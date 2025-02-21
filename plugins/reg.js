const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// Ruta del archivo JSON
const jsonFilePath = path.join(__dirname, 'database', 'reg.json');

// IDs del canal y mensajes
const CHANNEL_ID = -1002482643041; // ID del grupo/canal
const INSTRUCTION_MESSAGE_ID = 6; // ID del mensaje de instrucciones
const OTHER_MESSAGE_ID = 12; // ID de otro mensaje

// Probabilidades de enviar mensajes reenviados
const PROBABILITY_INSTRUCTION = 58; // 58% de probabilidad
const PROBABILITY_OTHER = 36; // 36% de probabilidad

// Función para cargar el archivo JSON
function loadJson() {
    if (!fs.existsSync(jsonFilePath)) {
        fs.writeFileSync(jsonFilePath, JSON.stringify([], null, 2), 'utf-8');
    }
    return JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
}

// Función para guardar en el archivo JSON
function saveJson(data) {
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Función para generar número de serie
function generateSerial() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Función para seleccionar archivo multimedia
function selectFileWithProbability() {
    const files = [
        { path: './src/menu_1.jpg', prob: 90 },
        { path: './src/menu_2.mp4', prob: 60 },
        { path: './src/menu_3.mp4', prob: 70 },
        { path: './src/menu_4.mp4', prob: 60 },
        { path: './src/menu_5.mp4', prob: 80 }
    ].filter(f => fs.existsSync(f.path));

    if (!files.length) return null;
    if (files.length === 1) return files[0].path;

    const total = files.reduce((sum, f) => sum + f.prob, 0);
    const random = Math.random() * total;
    let cumulative = 0;

    for (const file of files) {
        cumulative += file.prob;
        if (random <= cumulative) return file.path;
    }
    return files[0].path;
}

// Función para decidir si enviar un mensaje reenviado
function shouldSendMessage(probability) {
    return Math.random() * 100 < probability;
}

module.exports = (bot) => {
    // Comando de registro
    bot.command('reg', async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);

        if (args.length < 1) {
            return ctx.reply('⚠️ Formato: /reg [nombre.edad]\nEjemplo: /reg jimmy.15', {
                reply_to_message_id: ctx.message.message_id,
                parse_mode: 'Markdown'
            });
        }

        const [nombreEdad] = args;
        const [nombreUsuario, edadArg] = nombreEdad.split('.');
        const edad = parseInt(edadArg, 10) || 0;
        const userId = ctx.from.id;

        try {
            const users = loadJson();
            const userExist = users.find(user => user.id_telegram === userId);
            if (userExist) {
                // Si ya está registrado, sugerir usar /perfil
                await ctx.reply('❌ ¡Ya estás registrado! Te recomendamos usar /perfil para ver tu información.', {
                    reply_to_message_id: ctx.message.message_id,
                    parse_mode: 'Markdown'
                });

                // Enviar mensaje reenviado con probabilidad
                if (shouldSendMessage(PROBABILITY_INSTRUCTION)) {
                    await ctx.forwardMessage(ctx.chat.id, CHANNEL_ID, INSTRUCTION_MESSAGE_ID);
                } else if (shouldSendMessage(PROBABILITY_OTHER)) {
                    await ctx.forwardMessage(ctx.chat.id, CHANNEL_ID, OTHER_MESSAGE_ID);
                }

                return;
            }

            const newUser = {
                id_telegram: userId,
                nombre_usuario: nombreUsuario,
                fecha_registro: moment().tz('America/Managua').format(),
                zona_horaria: 'America/Costa_Rica',
                premium: 'none',
                numero_serie: generateSerial(),
                edad: edad,
                estado_civil: '',
                cumpleaños: '',
                nivel: 0,
                xp: 60,
                rango: 'novato',
                oro: 1000,
                diamantes: 20,
                tokens: 10,
                trabajo: 'Sin trabajo'
            };

            users.push(newUser);
            saveJson(users);

            const filePath = selectFileWithProbability();
            const region = newUser.zona_horaria.split('/')[1].replace(/_/g, ' ');
            const caption = `
╔╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╗
╏✎ *『REGISTRO EXITOSO』*
╚╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╝
╔╌╌MuliversoBot-TG╌╼
╎
╎❒ Nombre: ${newUser.nombre_usuario}
╎✰ Edad: ${newUser.edad}
╎❍ Estado: ${newUser.estado_civil}
╎✎ Nivel: ${newUser.nivel}
╎✏ Trabajo: ${newUser.trabajo}
╎✐ XP: ${newUser.xp}
╎🪙 Tokens: ${newUser.tokens}
╎💎 Diamantes: ${newUser.diamantes}
╎💰 Oro: ${newUser.oro}
╎🌍 Region: ${region}
╎🔢 N° Serie: ${newUser.numero_serie}
╚╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╼`;

            const buttons = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🏆 Menú RPG', callback_data: 'menu_rpg' }],
                        [{ text: '⚙️ Configuración', callback_data: 'config' }],
                        [{ text: '❌ Eliminar Cuenta', callback_data: 'delete_account' }]
                    ]
                }
            };

            if (filePath) {
                if (filePath.endsWith('.mp4')) {
                    await ctx.replyWithVideo({ source: filePath }, { caption, parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id, ...buttons });
                } else {
                    await ctx.replyWithPhoto({ source: filePath }, { caption, parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id, ...buttons });
                }
            } else {
                await ctx.reply(caption, { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id, ...buttons });
            }

        } catch (error) {
            console.error('Error en registro:', error);
            ctx.reply('❌ Error en el registro', {
                reply_to_message_id: ctx.message.message_id,
                parse_mode: 'Markdown'
            });
        }
    });

    // Comando para eliminar registro
    bot.command('eliminarregistro', async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);

        if (args.length < 1) {
            return ctx.reply('⚠️ Formato: /eliminarregistro [número_serie]\nEjemplo: /eliminarregistro ABC123XYZ', {
                reply_to_message_id: ctx.message.message_id,
                parse_mode: 'Markdown'
            });
        }

        const [numeroSerie] = args;
        const userId = ctx.from.id;

        try {
            const users = loadJson();
            const userIndex = users.findIndex(user => user.id_telegram === userId && user.numero_serie === numeroSerie);

            if (userIndex === -1) {
                return ctx.reply('❌ Número de serie inválido o no estás registrado.', {
                    reply_to_message_id: ctx.message.message_id,
                    parse_mode: 'Markdown'
                });
            }

            users.splice(userIndex, 1);
            saveJson(users);

            ctx.reply('✅ Tu registro ha sido eliminado correctamente.', {
                reply_to_message_id: ctx.message.message_id,
                parse_mode: 'Markdown'
            });

        } catch (error) {
            console.error('Error eliminando registro:', error);
            ctx.reply('❌ Error al eliminar el registro.', {
                reply_to_message_id: ctx.message.message_id,
                parse_mode: 'Markdown'
            });
        }
    });

    // Acción del botón "Eliminar Cuenta"
    bot.action('delete_account', async (ctx) => {
        await ctx.reply('⚠️ Para eliminar tu cuenta, usa el comando /eliminarregistro seguido de tu número de serie.', {
            reply_to_message_id: ctx.message.message_id,
            parse_mode: 'Markdown'
        });
    });
};