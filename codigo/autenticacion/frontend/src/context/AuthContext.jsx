import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ NUEVA LÓGICA: Verificar sesión con el servidor al cargar la app
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Intentamos obtener el perfil (esto enviará la cookie automáticamente)
        const response = await authService.getProfile();
        setUser(response.user);
      } catch (error) {
        // Si falla (401), el usuario no está logueado o la cookie expiró
        setUser(null);
      } finally {
        setLoading(false); // Deja de cargar sin importar el resultado
      }
    };

    checkAuthentication();
  }, []);

  // Función de login
  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Función de registro
  const register = async (email, password, name) => {
    try {
      const data = await authService.register(email, password, name);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ✅ MODIFICADO: Logout ahora es async
  const logout = async () => {
    try {
      await authService.logout(); // Avisa al backend para borrar la cookie
    } finally {
      setUser(null); // Limpia el estado local siempre
    }
  };

  // Verificar si está autenticado
  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {/* No renderizamos nada hasta que loading sea false. 
          Esto evita que el usuario vea la pantalla de login 
          por un milisegundo si ya tenía sesión activa. 
      */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};