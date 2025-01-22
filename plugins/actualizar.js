const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
const git = simpleGit();

module.exports = (bot) => {
    bot.command('actualizar', async (ctx) => {
        const repoUrl = 'https://github.com/Galaxia-Gaming-Studios/MultiversoBot-TG.git';
        const localPath = path.join(__dirname, '../temp-repo');
        
        // Clone or pull the latest changes from the repository
        const updateRepo = async () => {
            if (!fs.existsSync(localPath)) {
                await git.clone(repoUrl, localPath);
            } else {
                await git.cwd(localPath).pull();
            }
        };

        try {
            await updateRepo();

            // Path to the files and directories to be updated
            const filesToUpdate = [
                'index.js',
                'package.json',
                'package-lock.json',
                '.nomedia'
            ];
            const directoriesToUpdate = [
                'comandos',
                'src',
                'config'
            ];

            // Update files
            for (const file of filesToUpdate) {
                const remoteFilePath = path.join(localPath, file);
                const localFilePath = path.join(__dirname, '../', file);
                
                if (fs.existsSync(remoteFilePath)) {
                    const remoteFileContent = fs.readFileSync(remoteFilePath, 'utf-8');
                    const localFileContent = fs.existsSync(localFilePath) ? fs.readFileSync(localFilePath, 'utf-8') : '';

                    if (remoteFileContent !== localFileContent) {
                        fs.writeFileSync(localFilePath, remoteFileContent);
                        ctx.reply(`El archivo ${file} ha sido actualizado.`);
                    } else {
                        ctx.reply(`El archivo ${file} no ha cambiado.`);
                    }
                }
            }

            // Update directories
            const updateDirectory = (source, destination) => {
                const files = fs.readdirSync(source);
                
                files.forEach(file => {
                    const sourceFile = path.join(source, file);
                    const destFile = path.join(destination, file);
                    
                    if (fs.lstatSync(sourceFile).isDirectory()) {
                        if (!fs.existsSync(destFile)) {
                            fs.mkdirSync(destFile);
                        }
                        updateDirectory(sourceFile, destFile);
                    } else {
                        const sourceContent = fs.readFileSync(sourceFile, 'utf-8');
                        const destContent = fs.existsSync(destFile) ? fs.readFileSync(destFile, 'utf-8') : '';

                        if (sourceContent !== destContent) {
                            fs.writeFileSync(destFile, sourceContent);
                            ctx.reply(`El archivo ${destFile} ha sido actualizado.`);
                        }
                    }
                });
            };

            for (const directory of directoriesToUpdate) {
                const remoteDirPath = path.join(localPath, directory);
                const localDirPath = path.join(__dirname, '../', directory);

                if (fs.existsSync(remoteDirPath)) {
                    updateDirectory(remoteDirPath, localDirPath);
                }
            }

            ctx.reply('Actualización completada.');
        } catch (error) {
            console.error('Error al actualizar el repositorio:', error);
            ctx.reply('Hubo un error al actualizar el repositorio.');
        }
    });
};
