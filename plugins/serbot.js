// © serbot 1.2 EliasarYT 
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Telegraf } = require('telegraf');
const cfgPath = './config/sub-bot.json';
let bots = {};
if (fs.existsSync(cfgPath)) {
try {
bots = require(cfgPath);
} catch (err) {
console.error(`❌ Error al cargar ${cfgPath}:`, err);
bots = {};
}
} else {
fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
fs.writeFileSync(cfgPath, JSON.stringify(bots, null, 4));
}
function saveBots() {
try {
fs.writeFileSync(cfgPath, JSON.stringify(bots, null, 4));
} catch (err) {
console.error(`❌ Error al guardar ${cfgPath}:`, err);
}
}
function startBot(token, userId, ctx) {
try {
const proc = spawn('node', ['./sub-bot.js', token], {
stdio: 'inherit',
detached: true,
});
proc.unref();
ctx.reply(`✅ Sub-bot lanzado con éxito.`, {
reply_to_message_id: ctx.message.message_id,
});
bots[token] = { token, user: userId };
saveBots();
} catch (err) {
console.error('❌ Error al iniciar sub-bot:', err);
ctx.reply('❌ Error al iniciar el sub-bot.', {
reply_to_message_id: ctx.message.message_id,
});
}
}
function stopBot(token, ctx) {
delete bots[token];
saveBots();
ctx.reply(`✅ Sub-bot eliminado.`, {
reply_to_message_id: ctx.message.message_id,
});
}
async function getBotName(token) {
try {
const bot = new Telegraf(token);
const info = await bot.telegram.getMe();
return `@${info.username}`;
} catch {
return 'Desconocido';
}
}
module.exports = (bot) => {
bot.command('serbot', async (ctx) => {
if (ctx.chat.type !== 'private') {
return ctx.reply('❌ Solo en privado.', {
reply_to_message_id: ctx.message.message_id,
});
}
const args = ctx.message.text.split(' ').slice(1);
if (args.length === 0) {
return ctx.reply('❌ Proporciona el token. Ejemplo: /serbot <TOKEN>', {
reply_to_message_id: ctx.message.message_id,
});
}
const token = args[0];
if (bots[token]) {
return ctx.reply('⚠️ Este sub-bot ya está registrado.', {
reply_to_message_id: ctx.message.message_id,
});
}
startBot(token, ctx.from.id, ctx);
});
bot.command('stopsubbot', async (ctx) => {
if (ctx.chat.type !== 'private') {
return ctx.reply('❌ Solo en privado.', {
reply_to_message_id: ctx.message.message_id,
});
}
const args = ctx.message.text.split(' ').slice(1);
if (args.length === 0) {
return ctx.reply('❌ Proporciona el token. Ejemplo: /stopsubbot <TOKEN>', {
reply_to_message_id: ctx.message.message_id,
});
}
const token = args[0];
const botData = bots[token];
if (!botData) {
return ctx.reply('❌ Sub-bot no encontrado.', {
reply_to_message_id: ctx.message.message_id,
});
}
if (botData.user !== ctx.from.id) {
return ctx.reply('❌ No tienes permisos.', {
reply_to_message_id: ctx.message.message_id,
});
}
stopBot(token, ctx);
});
bot.command('listbots', async (ctx) => {
const total = Object.keys(bots).length;
if (total === 0) {
return ctx.reply('❌ No hay sub-bots registrados.', {
reply_to_message_id: ctx.message.message_id,
});
}
let msg = `📋 Total de sub-bots: ${total}\nBots:\n`;
for (const token in bots) {
const name = await getBotName(token);
msg += `- ${name}\n`;
}
ctx.reply(msg, {
reply_to_message_id: ctx.message.message_id,
});
});
let file = require.resolve(__filename);
fs.watchFile(file, () => {
fs.unwatchFile(file);
console.log(`♻️ Recargando módulo: ${path.basename(file)}`);
delete require.cache[file];
require(file)(bot);
});
};
