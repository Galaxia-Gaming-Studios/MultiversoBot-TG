// Código De EliasarYT 
// Alfa-TG 
const fs = require('fs');
const axios = require('axios');
const path = require('path');

module.exports = (bot) => {
  bot.command('s', async (conn) => {
    if (!conn.message.reply_to_message || !conn.message.reply_to_message.photo) {
      return conn.reply('❌ Responde a una imagen para convertirla en sticker.', {
        reply_to_message_id: conn.message.message_id,
      });
    }

    try {
      const fileId = conn.message.reply_to_message.photo.pop().file_id;
      const fileLink = await conn.telegram.getFileLink(fileId);
      const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);

      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

      const tempImagePath = path.join(tempDir, `temp_image_${Date.now()}.jpg`);
      fs.writeFileSync(tempImagePath, imageBuffer);

      await conn.replyWithSticker({ source: tempImagePath }, {
        reply_to_message_id: conn.message.message_id,
      });

      fs.unlinkSync(tempImagePath);
    } catch {
      conn.reply('❌ Error al crear el sticker.', {
        reply_to_message_id: conn.message.message_id,
      });
    }
  });
};