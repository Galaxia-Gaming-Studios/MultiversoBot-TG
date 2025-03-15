const fs = require('fs');
const path = require('path');

// Ruta al archivo JSON de registros
const DB_PATH = path.join(__dirname, '../database/reg.json');

// Cargar usuarios desde el archivo JSON
let users = [];
try {
  const rawData = fs.readFileSync(DB_PATH, 'utf-8');
  users = JSON.parse(rawData);
} catch (error) {
  users = []; // Si hay un error, inicializa como array vacío
}

// Middleware de verificación de registro
function checkRegistration() {
  return async (ctx, next) => {
    const userId = ctx.from.id;

    // Verificar si el comando requiere registro
    const requiresRegistration = ctx.handler?.register === true;

    // Si el comando NO requiere registro, continuar
    if (!requiresRegistration) {
      return next();
    }

    // Buscar usuario en la base de datos (en memoria)
    const isRegistered = users.some(user => user.id_telegram === userId);

    // Si NO está registrado, bloquear acción
    if (!isRegistered) {
      await ctx.reply(
        '🔐 Debes estar registrado para usar este comando.\n' +
        'Usa: `/reg [nombre.edad]`\nEjemplo: `/reg luis.25`',
        { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id }
      );
      return; // Detener la ejecución del comando
    }

    next(); // Usuario registrado: continuar
  };
}

module.exports = checkRegistration;