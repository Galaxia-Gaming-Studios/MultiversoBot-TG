module.exports = (bot) => {
    bot.command('test', async (ctx) => {
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
