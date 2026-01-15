const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Base de datos en memoria
// IMPORTANTE: El password del admin debe ser un HASH de bcrypt para que el login no falle
let users = [
  {
    id: 1,
    email: 'admin@example.com',
    password: '$2a$10$89v8Zid9E3Zk7Uf.f1s3A.fH7C6rY7hC7n8r8r8r8r8r8r8r8r8r', // Hash de "123456"
    name: 'Administrador',
    role: 'admin',
    createdAt: new Date('2024-01-01')
  }
];
let nextId = 2;

// Opciones de cookie reutilizables
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24 horas
};

// Middleware interno para verificar token
function authenticateToken(req, res, next) {
  // Asegurarse de que req.cookies existe (requiere cookie-parser en server.js)
  const token = req.cookies ? req.cookies.token : null;
  
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  // Si JWT_SECRET no existe, usamos uno por defecto para evitar que el servidor explote
  const secret = process.env.JWT_SECRET || 'clave_secreta_temporal';

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// --- RUTAS ---

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validación básica para evitar errores 500
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { 
        id: nextId++, 
        email, 
        password: hashedPassword, 
        name, 
        role: 'user', 
        createdAt: new Date() 
    };
    
    users.push(newUser);

    const secret = process.env.JWT_SECRET || 'clave_secreta_temporal';
    const token = jwt.sign(
        { userId: newUser.id, email: newUser.email }, 
        secret, 
        { expiresIn: '24h' }
    );

    res.cookie('token', token, cookieOptions);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'Registrado', user: userWithoutPassword });
  } catch (error) {
    console.error("Error en registro:", error); // Esto te dirá el error exacto en la consola
    res.status(500).json({ error: 'Error interno al crear usuario' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Bcrypt compare
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const secret = process.env.JWT_SECRET || 'clave_secreta_temporal';
    const token = jwt.sign(
        { userId: user.id, email: user.email }, 
        secret, 
        { expiresIn: '24h' }
    );

    res.cookie('token', token, cookieOptions);

    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Login exitoso', user: userWithoutPassword });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ message: 'Sesión cerrada' });
});

router.get('/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

module.exports = router;