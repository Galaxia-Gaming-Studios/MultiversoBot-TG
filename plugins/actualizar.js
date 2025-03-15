const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
const git = simpleGit();

module.exports = (bot) => {
    bot.command('actualizar', async (ctx) => {
        const repoUrl = 'https://github.com/Galaxia-Gaming-Studios/MultiversoBot-TG.git';
        const localPath = path.join(__dirname, '../tmp/temp-repo');
        const mainPath = path.join(__dirname, '../');

        ctx.reply(' Iniciando actualización...');

        const updateRepo = async () => {
            if (!fs.existsSync(localPath)) {
                await git.clone(repoUrl, localPath);
            } else {
                await git.cwd(localPath).pull();
            }
        };

        const copyRepoContent = async () => {
            const copyDirectory = (source, destination) => {
                const files = fs.readdirSync(source);

                files.forEach(file => {
                    const sourceFile = path.join(source, file);
                    const destFile = path.join(destination, file);

                    if (sourceFile.includes(path.join('database', path.sep))) {
                        return;
                    }

                    if (fs.lstatSync(sourceFile).isDirectory()) {
                        if (!fs.existsSync(destFile)) {
                            fs.mkdirSync(destFile);
                        }
                        copyDirectory(sourceFile, destFile);
                    } else {
                        fs.copyFileSync(sourceFile, destFile);
                    }
                });
            };

            copyDirectory(localPath, mainPath);
        };

        try {
            await updateRepo();
            await copyRepoContent();
            fs.rmSync(localPath, { recursive: true, force: true });

            ctx.reply('✅ Actualización completada. Reiniciando bot...');
            process.exit(0); // Reinicia el bot
        } catch (error) {
            console.error('Error al actualizar el repositorio:', error);
            ctx.reply('❌ Hubo un error al actualizar el repositorio. Por favor, revisa los logs.');
        }
    });
};
