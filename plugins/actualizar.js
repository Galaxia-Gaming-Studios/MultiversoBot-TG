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

        // Clonar o actualizar el repositorio
        const updateRepo = async () => {
            if (!fs.existsSync(localPath)) {
                await git.clone(repoUrl, localPath);
            } else {
                await git.cwd(localPath).pull();
            }
        };

        // Copiar todo el contenido del repositorio, excluyendo datos dentro de "database"
        const copyRepoContent = async () => {
            const copyDirectory = (source, destination) => {
                const files = fs.readdirSync(source);

                files.forEach(file => {
                    const sourceFile = path.join(source, file);
                    const destFile = path.join(destination, file);

                    // Excluir datos dentro de "database"
                    if (sourceFile.includes(path.join('database', path.sep))) {
                        return; // No copiar archivos dentro de "database"
                    }

                    if (fs.lstatSync(sourceFile).isDirectory()) {
                        if (!fs.existsSync(destFile)) {
                            fs.mkdirSync(destFile);
                        }
                        copyDirectory(sourceFile, destFile);
                    } else {
                        fs.copyFileSync(sourceFile, destFile);
                        ctx.reply(`Archivo copiado: ${destFile}`);
                    }
                });
            };

            copyDirectory(localPath, mainPath);
        };

        try {
            // Actualizar el repositorio
            await updateRepo();

            // Copiar todo el contenido del repositorio
            await copyRepoContent();

            // Eliminar el directorio temporal
            fs.rmSync(localPath, { recursive: true, force: true });
            ctx.reply('Directorio temporal eliminado.');

            ctx.reply('Actualización completada correctamente.');
        } catch (error) {
            console.error('Error al actualizar el repositorio:', error);
            ctx.reply('Hubo un error al actualizar el repositorio.');
        }
    });
};
