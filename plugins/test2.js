const authentication = require('../middleware/authentication');

module.exports = (bot) => {
    bot.command('test2', async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);
        const msgId = ctx.message.message_id;

        const caption = `
> Cita formtao cita 
\`\`\`Texto opcional 
cualquier. osa 
\`\`\`
__Hola test__`;

        try {
            await ctx.reply(caption, {
                parse_mode: 'MarkdownV2',
                reply_to_message_id: msgId
            });

        } catch (error) {
            await ctx.reply("An error occurred while processing your request.");
        }
    });
};



/*const authentication = require('../middleware/authentication');

module.exports = (bot) => {
    bot.command('test2', authentication.checkRegistration({ requireRegistration: true }), async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);
        const msgId = ctx.message.message_id;

        const caption = `
Hola
\\_\\_Hola test\\_\\_`;

        try {
            await ctx.reply(caption, {
                parse_mode: 'MarkdownV2',
                reply_to_message_id: msgId
            });
        } catch (error) {
            await ctx.reply("An error occurred while processing your request.");
        }
    });
};
*/