const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// Configurar moment en español
moment.locale('es');

const databaseDir = './database';
const filePath = path.join(databaseDir, 'zonahoraria.json');

// Función para asegurar la existencia de la base de datos
function ensureDatabaseExists() {
    if (!fs.existsSync(databaseDir)) {
        fs.mkdirSync(databaseDir);
    }
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]));
    }
}

// Leer datos existentes
function readZonasHorarias() {
    ensureDatabaseExists();
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Guardar nueva zona horaria
function saveZonaHoraria(userId, username, nombre, zonaHoraria) {
    const zonas = readZonasHorarias();
    const index = zonas.findIndex(user => user.ID === userId);
    
    const userData = {
        ID: userId,
        nombre,
        username: `@${username}`,
        zona_horaria: zonaHoraria,
        fecha_registro: new Date().toISOString()
    };

    if (index === -1) {
        zonas.push(userData);
    } else {
        zonas[index] = userData;
    }

    fs.writeFileSync(filePath, JSON.stringify(zonas, null, 2));
}

module.exports = (bot) => {
    bot.command('zonahoraria', async (ctx) => {
        const args = ctx.message.text.split(' ');
        const messageId = ctx.message.message_id;

        // Comando sin argumentos
        if (args.length < 2) {
            const caption = `
¡Hola *${ctx.from.first_name}*! 👋

Por favor, escribe tu zona horaria.  
Ejemplo: \`/zonahoraria America/Caracas\`

🔍 Busca tu zona aquí:  
[⏳Zonas Horarias](https://momentjs.com/timezone/)
            `;
            return ctx.reply(caption.trim(), { 
                reply_to_message_id: messageId,
                parse_mode: 'Markdown'
            });
        }

        const zonaHoraria = args[1];
        const userId = ctx.from.id;
        const username = ctx.from.username || ctx.from.first_name;

        try {
            // Validar zona horaria
            const zonaValida = moment.tz.zone(zonaHoraria);
            if (!zonaValida) {
                const caption = `
❌ *Zona horaria inválida*  
\`${zonaHoraria}\` no existe.

Prueba con:  
\`/zonahoraria Europe/Madrid\`  
\`/zonahoraria Asia/Tokyo\`

🔍 Lista completa: [momentjs.com/timezone/](https://momentjs.com/timezone/)
                `;
                return ctx.reply(caption.trim(), { 
                    reply_to_message_id: messageId,
                    parse_mode: 'Markdown'
                });
            }

            // Obtener información detallada
            const ahora = moment().tz(zonaHoraria);
            const fecha = ahora.format('dddd, D [de] MMMM [de] YYYY');
            const hora = ahora.format('h:mm:ss a').toUpperCase();
            
            // Obtener país
            let pais = 'Desconocido';
            try {
                pais = new Intl.DisplayNames(['es'], { type: 'region' }).of(zonaValida.countries[0]) || 
                       zonaHoraria.split('/')[1];
            } catch (e) {
                pais = zonaHoraria.split('/')[1] || zonaHoraria;
            }

            // Guardar en base de datos
            saveZonaHoraria(userId, username, ctx.from.first_name, zonaHoraria);

            // Respuesta final
            const caption = `
⏰ *Hora actual en ${pais}:*  
\`${hora}\`  
🗓️ *Fecha:*  
\`${fecha}\`

✅ *Zona horaria registrada:*  
\`${zonaHoraria}\`
            `;

            ctx.reply(caption.trim(), { 
                reply_to_message_id: messageId,
                parse_mode: 'Markdown'
            });

        } catch (error) {
            console.error('Error:', error);
            const caption = `
❌ *Error crítico*  
No pude procesar tu solicitud.  
Por favor intenta nuevamente más tarde.
            `;
            ctx.reply(caption.trim(), { 
                reply_to_message_id: messageId,
                parse_mode: 'Markdown'
            });
        }
    });
};