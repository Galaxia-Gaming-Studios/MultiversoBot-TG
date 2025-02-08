const fetch = require('node-fetch');

module.exports = (bot) => {
  bot.command('terremoto', async (ctx) => {
    try {
      // Obtener datos del terremoto desde la API de BMKG
      const response = await fetch("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json");
      const data = (await response.json()).Infogempa.gempa;

      // Construir el mensaje con la información del terremoto
      const message = `
⚠️ *Alerta de Terremoto* ⚠️

📍 *Ubicación:* ${data.Wilayah}

📅 *Fecha:* ${data.Tanggal}
⏰ *Hora:* ${data.Jam}
🚨 *Impacto Potencial:* ${data.Potensi}

📊 *Detalles:*
• Magnitud: ${data.Magnitude}
• Profundidad: ${data.Kedalaman}
• Coordenadas: ${data.Coordinates}
${data.Dirasakan.length > 3 ? `• Sentido: ${data.Dirasakan}` : ''}

Mantente a salvo y informado! 🌍

> 🚩 Powered by Jose XrL 
      `;

      // Enviar el mensaje al usuario
      await ctx.replyWithMarkdown(message);
    } catch (error) {
      console.error(error);
      await ctx.reply('❌ Ocurrió un error al obtener la información del terremoto. Por favor, intenta nuevamente más tarde.');
    }
  });
};
