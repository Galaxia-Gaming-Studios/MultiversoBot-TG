const { MongoClient } = require('mongodb');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

// Conexión a MongoDB
const mongoClient = new MongoClient('mongodb://localhost:27017');
let db;

(async () => {
    try {
        await mongoClient.connect();
        db = mongoClient.db('rpg_bot');
        console.log('✅ Conexión a MongoDB establecida');
    } catch (err) {
        console.error('❌ Error conectando a MongoDB:', err);
    }
})();

function generateSerial() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

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

module.exports = (bot) => {
    bot.command('reg', async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);
        
        if (args.length < 1) {
            return ctx.reply('⚠️ Formato: /reg [nombre_usuario] [edad]');
        }
        
        const [nombreUsuario, edadArg] = args;
        const edad = parseInt(edadArg, 10) || 0;
        const userId = ctx.from.id;
        
        try {
            const userExist = await db.collection('users').findOne({ id_telegram: userId });
            if (userExist) {
                return ctx.reply('❌ ¡Ya estás registrado!');
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
            
            await db.collection('users').insertOne(newUser);
            
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
                    await ctx.replyWithVideo({ source: filePath }, { caption, parse_mode: 'Markdown', ...buttons });
                } else {
                    await ctx.replyWithPhoto({ source: filePath }, { caption, parse_mode: 'Markdown', ...buttons });
                }
            } else {
                await ctx.reply(caption, { parse_mode: 'Markdown', ...buttons });
            }
            
        } catch (error) {
            console.error('Error en registro:', error);
            ctx.reply('❌ Error en el registro');
        }
    });
};
