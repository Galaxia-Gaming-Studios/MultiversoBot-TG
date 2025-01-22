// Importar módulos necesarios

const fs = require('fs'); // Módulo del sistema de archivos

const path = require('path'); // Módulo para manejar rutas de archivos y directorios

const chalk = require('chalk'); // Módulo para dar color a la salida en la consola

const si = require('systeminformation'); // Módulo para obtener información del sistema

module.exports = (bot) => {

    // Comando 'info' para obtener información del sistema

    bot.command('info', async (ctx) => {

        try {

            // Obtener información del sistema utilizando el módulo 'systeminformation'

            const systemData = await si.get({

                osInfo: '*', // Información del sistema operativo

                cpu: '*', // Información de la CPU

                mem: 'total, free, used, active, available', // Información de la memoria

                diskLayout: '*', // Información del disco

                currentLoad: '*', // Información de la carga actual del sistema

                networkInterfaces: '*', // Información de las interfaces de red

                system: '*', // Información del sistema en general

                uptime: '*', // Tiempo de actividad del sistema

                processes: '*' // Información de los procesos

            });

            // Extraer información específica del objeto 'systemData'

            const osInfo = systemData.osInfo;

            const cpuInfo = systemData.cpu;

            const memoryInfo = systemData.mem;

            const disks = systemData.diskLayout;

            const load = systemData.currentLoad;

            const uptime = systemData.uptime;

            const processes = systemData.processes.all;

            const network = systemData.networkInterfaces.map(

                net => `- ${net.iface} (${net.type}): ${net.ip4 || 'No IPv4'}, MAC: ${net.mac}`

            ).join('\n');

            // Formatear la información del sistema

            const systemInfo = `

🌐 *🌍 Información del Sistema:*

🖥️ **Nombre del Host:** ${systemData.system.hostname || 'No Disponible'}

🏭 **Fabricante:** ${systemData.system.manufacturer || 'No Disponible'}

📦 **Modelo:** ${systemData.system.model || 'No Disponible'}

💻 **Plataforma:** ${osInfo.platform || 'No Disponible'} (${osInfo.arch || 'No Disponible'})

📀 **Distribución:** ${osInfo.distro || 'No Disponible'} ${osInfo.release || ''} (${osInfo.codename || ''})

⚙️ **Versión del Kernel:** ${osInfo.kernel || 'No Disponible'}

🖥️ *⚡ Información del CPU:*

⚒️ **Fabricante:** ${cpuInfo.manufacturer || 'No Disponible'}

💡 **Modelo:** ${cpuInfo.brand || 'No Disponible'}

🔢 **Núcleos:** ${cpuInfo.cores || 'No Disponible'} (Físicos: ${cpuInfo.physicalCores || 'No Disponible'})

🚀 **Velocidad:** ${cpuInfo.speed || 'No Disponible'} GHz (Máx: ${cpuInfo.speedMax || 'No Disponible'} GHz)

📂 **Caché:** ${cpuInfo.cache ? `${cpuInfo.cache.l1d || 0} L1, ${cpuInfo.cache.l2 || 0} L2, ${cpuInfo.cache.l3 || 0} L3` : 'No Disponible'}

💾 *📊 Memoria:*

🛑 **Total:** ${(memoryInfo.total ? memoryInfo.total / 1024 / 1024 / 1024 : 0).toFixed(2)} GB

🔵 **Libre:** ${(memoryInfo.free ? memoryInfo.free / 1024 / 1024 / 1024 : 0).toFixed(2)} GB

🔴 **Usada:** ${(memoryInfo.used ? memoryInfo.used / 1024 / 1024 / 1024 : 0).toFixed(2)} GB

📂 *💾 Almacenamiento:*

${disks.length > 0 

    ? disks.map(disk => `💽 ${disk.name || 'Desconocido'} (${disk.type || 'Desconocido'}) – Tamaño: ${(disk.size / 1024 / 1024 / 1024).toFixed(2)} GB`).join('\n') 

    : '🔒 **No Disponible**'}

⚡ *📉 Carga del Sistema:*

📈 **Promedio (1m):** ${load.avgLoad ? load.avgLoad.toFixed(2) : 'No Disponible'}

🔥 **Uso del CPU:** ${load.currentLoad ? load.currentLoad.toFixed(2) : 'No Disponible'}%

📋 **Procesos Totales:** ${processes || 'No Disponible'}

⏳ *⌛ Tiempo de Actividad:*

⏱️ **Uptime:** ${(uptime ? (uptime / 3600).toFixed(2) : 'No Disponible')} Horas

🌐 *📶 Red:*

${network || '🔒 **No Disponible**'}

`;

            // Ruta a la imagen a enviar

            const imagePath = path.join(__dirname, '../src/menu1.jpg');

            // Enviar mensaje con la foto y la información del sistema

            ctx.replyWithPhoto({ source: imagePath }, {

                caption: `\n\n${systemInfo}`,

                parse_mode: 'Markdown',

                reply_to_message_id: ctx.message.message_id

            });

        } catch (error) {

            // Manejar errores al obtener la información del sistema

            console.error(error);

            ctx.reply('❌ Ocurrió un error al obtener la información.', { reply_to_message_id: ctx.message.message_id });

        }

    });

};