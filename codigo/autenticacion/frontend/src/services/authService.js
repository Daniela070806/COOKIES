const API_URL = '/api/auth';

export const authService = {
  // 1. Registro de usuario
  register: async (email, password, name) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Permite recibir la cookie del servidor
      body: JSON.stringify({ email, password, name })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar usuario');
    }

    // Retornamos los datos del usuario (el token ya está en la cookie)
    return response.json();
  },

  // 2. Inicio de sesión
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Permite recibir la cookie
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar sesión');
    }

    return response.json();
  },

  // 3. Cerrar sesión (Ahora es ASYNC porque debe avisar al servidor)
  logout: async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include' // Envía la cookie para que el servidor la borre
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  },

  // 4. Obtener perfil del servidor (Verifica si la cookie es válida)
  getProfile: async () => {
    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      credentials: 'include' // Envía la cookie automáticamente
    });

    if (!response.ok) {
      throw new Error('Sesión no válida o expirada');
    }

    return response.json();
  },

  // 5. Reemplazo de fetchWithAuth
  // Ya no necesitamos añadir el Header "Authorization" manualmente
  fetchWithAuth: async (url, options = {}) => {
    const config = {
      ...options,
      credentials: 'include', // Asegura que se envíe la cookie
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      }
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // Si el servidor dice que no hay cookie o es inválida
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }

    return response;
  }
};