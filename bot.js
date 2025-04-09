const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const cfonts = require('cfonts');
const gradient = require('gradient-string');
const readline = require('readline');
//====== Carga A Server.js ======

//====== Fin ======

// Variable global para almacenar los comandos
const comandosRegistrados = [];

// Función para limpiar la carpeta ./tmp
const limpiarTmp = () => {
    const tmpDir = './tmp';
    if (fs.existsSync(tmpDir)) {
        fs.readdirSync(tmpDir).forEach(file => {
            const filePath = path.join(tmpDir, file);
            try {
                if (fs.lstatSync(filePath).isDirectory()) {
                    fs.rmdirSync(filePath, { recursive: true });
                } else {
                    fs.unlinkSync(filePath);
                }
                console.log(chalk.green(`
╭╌╌╌╌╌╌╌╌╌╌╮
╎🚀Tmp Eliminado
╰╌╌╌╌╌╌╌╌╌╌╯
                `));
            } catch (err) {
                console.error(chalk.red(`
╭╌╌╌╌╌╌╌╌╌╌╮
╎❌Tmp Error❌ 
╰╌╌╌╌╌╌╌╌╌╌╯
                `));
                console.error(chalk.red(`Error al eliminar ${filePath}:`), err);
            }
        });
    } else {
        console.log(chalk.yellow('La carpeta ./tmp no existe.'));
    }
};

// Ejecutar la limpieza cada 5 minutos (300000 ms = 5 minutos)
setInterval(limpiarTmp, 60000);

// Función para pedir el token
const pedirToken = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question("Por favor, ingresa tu token de bot de Telegram: ", (token) => {
            rl.close();
            resolve(token.trim());
        });
    });
};

// Validar si el token es válido
const validarToken = async (token) => {
    try {
        const bot = new Telegraf(token);
        await bot.telegram.getMe();
        console.log(gradient.pastel.multiline("Token válido. Iniciando el bot...\n"));
        return true;
    } catch (error) {
        console.log(gradient.morning("Token inválido. Intenta nuevamente.\n"));
        return false;
    }
};

// Función para obtener el token
const obtenerToken = async () => {
    const tokenPath = './config/token.json';

    let token;
    if (fs.existsSync(tokenPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
            token = config.token;
        } catch (err) {
            console.error("Error al leer el archivo token.json. Regenerando...");
        }
    }

    // Si no hay token válido, pedir al usuario
    while (!token) {
        token = await pedirToken();
        const esValido = await validarToken(token);
        if (esValido) {
            // Crear token.json
            fs.mkdirSync('./config', { recursive: true });
            fs.writeFileSync(tokenPath, JSON.stringify({ token }, null, 2));
            console.log("Token guardado correctamente en token.json");
        } else {
            token = null; // Forzar nueva solicitud
        }
    }

    return token;
};

// Mostrar el banner del bot
const mostrarBanner = () => {
    const banner = cfonts.render(('Multi\verso\nBot TG | 1.0.0'), {
        font: 'block',
        align: 'center',
        colors: ['cyan', 'magenta'],
        background: 'transparent',
        letterSpacing: 1,
        lineHeight: 1,
        space: true,
        maxLength: '0',
    });
    console.log(banner.string);

    const welcomeMessage = `
 ✧༺✦✮✦༻∞ 𝑇𝑒𝑙𝑒𝑔𝑟𝑎𝑚 ∞༺✦✮✦༻✧ 
╔═╗╔═╦╗─╔╦╗──╔════╦══╗
║║╚╝║║║─║║║──║╔╗╔╗╠╣╠╝
║╔╗╔╗║║─║║║──╚╝║║╚╝║║─
║║║║║║║─║║║─╔╗─║║──║║─
║║║║║║╚═╝║╚═╝║─║║─╔╣╠╗
╚╝╚╝╚╩═══╩═══╝─╚╝─╚══╝
╔╗──╔╦═══╦═══╦═══╦═══╗
║╚╗╔╝║╔══╣╔═╗║╔═╗║╔═╗║
╚╗║║╔╣╚══╣╚═╝║╚══╣║─║║
─║╚╝║║╔══╣╔╗╔╩══╗║║─║║
─╚╗╔╝║╚══╣║║╚╣╚═╝║╚═╝║
──╚╝─╚═══╩╝╚═╩═══╩═══╝
╔══╗╔═══╦════╗──╔════╗
║╔╗║║╔═╗║╔╗╔╗║──║╔╗╔╗║
║╚╝╚╣║─║╠╝║║╚╬══╬╝║║╚╝
║╔═╗║║─║║─║║─╚══╝─║║──
║╚═╝║╚═╝║─║║──────║║──
╚═══╩═══╝─╚╝──────╚╝──
╔═══╗
║╔═╗║
║║─╚╝
║║╔═╗
║╚╩═║
╚═══╝


©️❲ɢʟᴏʙᴀʟ ɢɢs❳🌏 🌎 🌍 🌐 🛰️
©️2024
    `;
    console.log(gradient.rainbow(welcomeMessage));
};

// Cargar comandos dinámicamente (sin notificaciones)
const cargarComandos = (dir, bot) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(item => {
        const fullPath = path.join(dir, item.name);
        const registro = {
            nombre: item.name,
            estado: '✅ Cargado',
            error: null
        };

        if (item.isDirectory()) {
            cargarComandos(fullPath, bot);
        } else if (item.isFile() && item.name.endsWith('.js')) {
            try {
                const comando = require(fullPath);
                if (typeof comando === 'function') {
                    comando(bot);
                }
            } catch (err) {
                registro.estado = '⚠️ Error';
                registro.error = err.message.substring(0, 50) + '...';
            }
            comandosRegistrados.push(registro);
        }
    });
};

// Formatear la hora
const formatTime = () => {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
};

// Manejar y mostrar logs en la consola
function logMessage(ctx, command = null) {
    const user = ctx.from.username || `${ctx.from.first_name} ${ctx.from.last_name || ''}`;
    const isPrivate = ctx.chat.type === 'private' ? 'Sí' : 'No';
    const chatTitle = ctx.chat.title || 'N/A';
    const topic = ctx.message.is_topic_message ? `Tema: ${ctx.message.topic_name}` : 'N/A';
    const mediaInfo = ctx.message.audio
        ? `Audio - Duración: ${ctx.message.audio.duration} segundos`
        : ctx.message.video
        ? `Video - Duración: ${ctx.message.video.duration} segundos`
        : ctx.message.sticker
        ? `Sticker - Emoji: ${ctx.message.sticker.emoji}`
        : ctx.message.document
        ? `Archivo - Nombre: ${ctx.message.document.file_name}`
        : '';

    console.log(`
${chalk.blue(`╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌≫`)}
${chalk.blue(`╎`)}${chalk.blue(`🌌 Bienvenid@ A MultiversoBot-TG🌌`)}
${chalk.blue(`╎`)}${chalk.cyan(`🆔 IDs: ${ctx.from.id}`)}
${chalk.blue(`╎`)}${chalk.magenta(`🕕 Hora: ${formatTime()}`)}
${chalk.blue(`╎`)}${chalk.blue(`👥 Grupo: ${chatTitle}`)}
${chalk.blue(`╎`)}${chalk.green(`📂 Tema: ${topic}`)}
${chalk.blue(`╎`)}${chalk.yellow(`🔒 Privado: ${isPrivate}`)}
${chalk.blue(`╎`)}${chalk.red(`👤 Usuario: @${user}`)}
${chalk.blue(`╎`)}${chalk.white(`📩 Mensaje: ${ctx.message.text || mediaInfo || 'Archivo multimedia recibido'}`)}
${chalk.blue(`╎`)}${chalk.blue(`📌 Comando: ${command || 'Null'}`)}
${chalk.blue(`╎`)}${chalk.blue(`📝 ID del mensaje: ${ctx.message.message_id}`)}
${chalk.blue(`╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌≫`)}
    `);
}

// Iniciar el bot
const iniciarBot = async () => {
    const token = await obtenerToken();
    mostrarBanner();
    const bot = new Telegraf(token);

    // Cargar comandos desde la carpeta plugins
    cargarComandos(path.join(__dirname, 'plugins'), bot);

    // Escuchar el comando /plugins en la consola
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', (input) => {
        if (input.trim() === '/plugins') {
            console.log(chalk.cyan.bold('\n╭━━━━━━━━━━━━━━━━━━━━━≫'));
            console.log(chalk.cyan.bold('╎  LISTADO DE COMANDOS  '));
            console.log(chalk.cyan.bold('╰━━━━━━━━━━━━━━━━━━━━━≫'));
            
            comandosRegistrados.forEach(comando => {
                const estadoColor = comando.estado.startsWith('✅') 
                    ? chalk.green 
                    : chalk.red;
                
                console.log(`
╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌≫
${chalk.blue(`╎ Comando: ${comando.nombre}`)}
${chalk.yellow(`╎ Estado: `)}${estadoColor(comando.estado)}${comando.error ? `
${chalk.red(`╎ Error: ${comando.error}`)}` : ''}
╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌≫`);
            });
            console.log(chalk.cyan.bold('\n═⋆≫ Fin del listado ≪⋆═\n'));
        }
    });

    bot.on('text', (ctx) => {
        logMessage(ctx);
    });

    bot.launch().then(() => {
        console.log('Bot iniciado correctamente');
    }).catch(error => {
        console.error('Error al iniciar el bot:', error);
    });
};

// Iniciar el proceso
iniciarBot();
