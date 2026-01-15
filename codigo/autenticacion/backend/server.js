const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');

const app = express();

// 1. Configuración de CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// 2. Parsers (DEBEN ir antes de las rutas)
app.use(express.json());
app.use(cookieParser());

// 3. Rutas
app.use('/api/auth', authRoutes);

// Ruta base para testear
app.get('/', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente 🚀' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});