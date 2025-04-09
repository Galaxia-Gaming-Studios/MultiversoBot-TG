const { ytdl, ytdltxt } = require('savetubedl');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = (bot) => {
  bot.command('play', async (ctx) => {
    console.log('[play] Comando recibido');
    
    try {
      // Obtener el texto después del comando
      const input = ctx.message.text.split(' ').slice(1).join(' ').trim();
      
      if (!input) {
        console.log('[play] Falta parámetro de búsqueda');
        try {
          await ctx.reply('ℹ️ Uso correcto:\n/play [URL o búsqueda]\nEjemplo:\n/play https://youtu.be/...\n/play Never Gonna Give You Up', {
            reply_to_message_id: ctx.message.message_id
          });
        } catch (error) {
          console.error('[play] Error al enviar mensaje de ayuda:', error);
        }
        return;
      }

      console.log(`[play] Procesando: ${input}`);
      
      let processingMsg;
      try {
        processingMsg = await ctx.reply('⏳ Procesando tu video en 144p...', {
          reply_to_message_id: ctx.message.message_id
        });
      } catch (error) {
        console.error('[play] Error al enviar mensaje de procesamiento:', error);
        return;
      }

      // Verificar si es URL válida de YouTube
      const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/i.test(input);
      console.log(`[play] Es URL: ${isUrl}`);

      let videoInfo;
      try {
        if (isUrl) {
          console.log('[play] Ejecutando ytdl en calidad 144p');
          videoInfo = await ytdl(input, '144');
        } else {
          console.log('[play] Ejecutando ytdltxt en calidad 144p');
          videoInfo = await ytdltxt(input, '144');
        }
        console.log('[play] Respuesta de savetubedl:', JSON.stringify(videoInfo, null, 2));
      } catch (apiError) {
        console.error('[play] Error en savetubedl:', apiError);
        try {
          await ctx.reply('⚠️ Error al comunicarse con el servicio de YouTube. Intenta más tarde.', {
            reply_to_message_id: ctx.message.message_id
          });
        } catch (error) {
          console.error('[play] Error al enviar mensaje de error:', error);
        }
        return;
      }

      // Validar respuesta
      if (!videoInfo?.status || !videoInfo?.response?.descarga) {
        console.log('[play] Respuesta inválida de savetubedl');
        try {
          await ctx.reply('❌ No se encontró el video solicitado. Verifica el enlace o término de búsqueda.', {
            reply_to_message_id: ctx.message.message_id
          });
        } catch (error) {
          console.error('[play] Error al enviar mensaje de error:', error);
        }
        return;
      }

      // Crear directorio temporal si no existe
      const tempDir = './temp_videos';
      if (!fs.existsSync(tempDir)) {
        try {
          fs.mkdirSync(tempDir, { recursive: true });
        } catch (mkdirError) {
          console.error('[play] Error al crear directorio temporal:', mkdirError);
          try {
            await ctx.reply('⚠️ Error interno al preparar la descarga.', {
              reply_to_message_id: ctx.message.message_id
            });
          } catch (error) {
            console.error('[play] Error al enviar mensaje de error:', error);
          }
          return;
        }
      }

      // Limpiar nombre del archivo
      const cleanTitle = videoInfo.response.titulo
        .replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜ-]/gi, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      const videoFileName = `${cleanTitle}.mp4`;
      const videoPath = path.join(tempDir, videoFileName);

      console.log(`[play] Descargando video a: ${videoPath}`);
      
      // Descargar el archivo con headers personalizados
      try {
        const response = await axios({
          method: 'get',
          url: videoInfo.response.descarga,
          responseType: 'stream',
          timeout: 45000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.youtube.com/'
          }
        });

        const writer = fs.createWriteStream(videoPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        console.log('[play] Video descargado correctamente');
      } catch (downloadError) {
        console.error('[play] Error al descargar video:', downloadError);
        try {
          await ctx.reply('⚠️ Error al descargar el video. Intenta con otro enlace.', {
            reply_to_message_id: ctx.message.message_id
          });
        } catch (error) {
          console.error('[play] Error al enviar mensaje de error:', error);
        }
        return;
      }

      // Verificar que el archivo existe y tiene tamaño > 0
      try {
        const stats = fs.statSync(videoPath);
        if (stats.size === 0) {
          fs.unlinkSync(videoPath);
          throw new Error('Archivo vacío');
        }
      } catch (fileError) {
        console.error('[play] Error con el archivo descargado:', fileError);
        try {
          await ctx.reply('⚠️ El video descargado está corrupto. Intenta nuevamente.', {
            reply_to_message_id: ctx.message.message_id
          });
        } catch (error) {
          console.error('[play] Error al enviar mensaje de error:', error);
        }
        return;
      }

      // Enviar resultados
      try {
        console.log('[play] Enviando miniatura y video');
        
        try {
          await ctx.replyWithPhoto(videoInfo.response.miniatura, {
            caption: `🎬 *${videoInfo.response.titulo}*\n` +
                     `⏱️ *Duración:* ${formatDuration(videoInfo.response.duracion)}\n` +
                     `📺 *Calidad:* 144p\n` +
                     `🔗 *ID:* \`${videoInfo.response.id}\``,
            parse_mode: 'Markdown',
            reply_to_message_id: ctx.message.message_id
          });

          await ctx.replyWithVideo(
            { source: fs.createReadStream(videoPath) },
            {
              caption: videoInfo.response.titulo,
              thumb: { url: videoInfo.response.miniatura },
              supports_streaming: true,
              reply_to_message_id: ctx.message.message_id
            }
          );

          console.log('[play] Video enviado correctamente');
        } catch (sendError) {
          console.error('[play] Error al enviar video:', sendError);
          try {
            await ctx.reply('⚠️ Error al enviar el video. El archivo podría ser muy grande.', {
              reply_to_message_id: ctx.message.message_id
            });
          } catch (error) {
            console.error('[play] Error al enviar mensaje de error:', error);
          }
        }
      } catch (error) {
        console.error('[play] Error en el flujo de envío:', error);
      }

      // Limpieza
      try {
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
          console.log('[play] Archivo temporal eliminado');
        }
      } catch (cleanError) {
        console.error('[play] Error al limpiar archivo:', cleanError);
      }

      try {
        if (processingMsg) {
          await ctx.deleteMessage(processingMsg.message_id);
        }
      } catch (deleteError) {
        console.error('[play] Error al borrar mensaje:', deleteError);
      }

    } catch (error) {
      console.error('[play] Error general:', error);
      try {
        await ctx.reply('⚠️ Ocurrió un error inesperado. Por favor reporta este problema.', {
          reply_to_message_id: ctx.message.message_id
        });
      } catch (err) {
        console.error('[play] Error al enviar mensaje de error general:', err);
      }
    }
  });
};

// Función para formatear duración (segundos a MM:SS)
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}