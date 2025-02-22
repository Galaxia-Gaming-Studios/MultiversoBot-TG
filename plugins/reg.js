const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// Configuración de rutas
const DB_PATH = path.join(__dirname, 'database', 'reg.json');

// Sistema de probabilidades mejorado
class ProbabilitySystem {
  static selectFile() {
    const files = [
      { path: './src/menu_1.jpg', prob: 90 },
      { path: './src/menu_2.mp4', prob: 60 },
      { path: './src/menu_3.mp4', prob: 70 },
      { path: './src/menu_4.mp4', prob: 60 },
      { path: './src/menu_5.mp4', prob: 80 }
    ].filter(f => fs.existsSync(f.path));

    if (!files.length) return null;
    
    const total = files.reduce((sum, f) => sum + f.prob, 0);
    const random = Math.random() * total;
    let cumulative = 0;

    for (const file of files) {
      cumulative += file.prob;
      if (random <= cumulative) return file.path;
    }
    return files[0].path;
  }
}

// Gestor de base de datos JSON
class Database {
  constructor() {
    this.ensureDatabase();
  }

  ensureDatabase() {
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
    }
  }

  load() {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  }

  save(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }

  generateSerial() {
    return [...Array(8)].map(() => Math.random().toString(36)[2]).join('').toUpperCase();
  }
}

module.exports = (bot) => {
  const db = new Database();

  // Comando de registro mejorado
  bot.command('reg', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const msgId = ctx.message.message_id;

    // Validación de formato
    if (!args[0] || !args[0].includes('.')) {
      return ctx.reply(
        '⚠️ Formato: `/reg [nombre.edad]`\nEjemplo: `/reg jimmy.15`',
        { reply_to_message_id: msgId, parse_mode: 'Markdown' }
      );
    }

    const [username, ageStr] = args[0].split('.');
    const age = parseInt(ageStr) || 0;
    const userId = ctx.from.id;

    try {
      const users = db.load();
      const existingUser = users.find(u => u.id_telegram === userId);

      if (existingUser) {
        return ctx.reply(
          '❌ ¡Ya estás registrado! Usa `/perfil` para ver tus datos.',
          { reply_to_message_id: msgId, parse_mode: 'Markdown' }
        );
      }

      const newUser = {
        id_telegram: userId,
        nombre_usuario: username,
        fecha_registro: moment().tz('America/Managua').format(),
        zona_horaria: 'America/Costa_Rica',
        numero_serie: db.generateSerial(),
        edad: age,
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
      db.save(users);

      // Generar respuesta
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

      const filePath = ProbabilitySystem.selectFile();
      
      if (filePath) {
        const method = filePath.endsWith('.mp4') ? 'replyWithVideo' : 'replyWithPhoto';
        await ctx[method]({ source: filePath }, { 
          caption, 
          parse_mode: 'Markdown',
          reply_to_message_id: msgId,
          ...buttons
        });
      } else {
        await ctx.reply(caption, {
          parse_mode: 'Markdown',
          reply_to_message_id: msgId,
          ...buttons
        });
      }

    } catch (error) {
      console.error('Error en registro:', error);
      ctx.reply('❌ Error en el registro', { reply_to_message_id: msgId });
    }
  });

  // Sistema de eliminación
  bot.command('eliminarregistro', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const msgId = ctx.message.message_id;

    if (!args[0]) {
      return ctx.reply(
        '⚠️ Formato: `/eliminarregistro [número_serie]`\nEjemplo: `/eliminarregistro ABC123XYZ`',
        { reply_to_message_id: msgId, parse_mode: 'Markdown' }
      );
    }

    try {
      const users = db.load();
      const initialLength = users.length;
      
      const filtered = users.filter(user => 
        user.id_telegram !== ctx.from.id || 
        user.numero_serie !== args[0]
      );

      if (filtered.length === initialLength) {
        return ctx.reply(
          '❌ Registro no encontrado o número de serie inválido',
          { reply_to_message_id: msgId, parse_mode: 'Markdown' }
        );
      }

      db.save(filtered);
      ctx.reply('✅ Registro eliminado exitosamente', { reply_to_message_id: msgId });

    } catch (error) {
      console.error('Error eliminando registro:', error);
      ctx.reply('❌ Error al eliminar el registro', { reply_to_message_id: msgId });
    }
  });

  // Manejo del botón de eliminación
  bot.action('delete_account', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      '⚠️ Para eliminar tu cuenta usa:\n`/eliminarregistro [tu_número_serie]`\nEjemplo: `/eliminarregistro ABC123XYZ`',
      { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id }
    );
  });
};