const express = require('express');
const path = require('path');
const os = require('os');
const si = require('systeminformation');
const app = express();

// Configurar middleware para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para la información del sistema
app.get('/info', async (req, res) => {
    const info = {
        memory: process.memoryUsage().heapUsed / 1024 / 1024,
        system: os.type(),
        cpu: os.cpus().length,
        uptime: process.uptime(),
    };

    try {
        const memory = await si.memory();
        res.json({
            memory: memory.used / 1024 / 1024,
            cpus: os.cpus().length,
            uptime: process.uptime(),
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener información del sistema' });
    }
});

// Ruta para el monitor
app.get('/monitor', async (req, res) => {
    const info = {
        memory: process.memoryUsage().heapUsed / 1024 / 1024,
        system: os.type(),
        cpu: os.cpus().length,
        uptime: process.uptime(),
    };
    res.json(info);
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express iniciado en el puerto ${PORT}`);
    console.log(`Visita http://localhost:${PORT} para ver la página web`);
});

module.exports = app;