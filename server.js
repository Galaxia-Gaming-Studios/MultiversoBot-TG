const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Middleware para procesar formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para mostrar el formulario del token
app.get('/token', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'token.html'));
});

// Ruta para procesar el token
app.post('/save-token', (req, res) => {
    const { token } = req.body;
    const tokenPath = './config/token.json';

    try {
        fs.mkdirSync('./config', { recursive: true });
        fs.writeFileSync(tokenPath, JSON.stringify({ token }, null, 2));
        res.send('Token guardado correctamente. Puedes iniciar el bot ahora.');
    } catch (err) {
        res.status(500).send('Error al guardar el token');
    }
});

// Cargar el bot automáticamente si existe el token
const tokenPath = './config/token.json';
if (fs.existsSync(tokenPath)) {
    require('./a');
    console.log('Bot iniciado automáticamente');
} else {
    console.log('Por favor ingresa el token en http://localhost:3000/token');
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});