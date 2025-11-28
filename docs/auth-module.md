# Módulo de Autenticación - Guía de Integración Next.js

## Descripción
Sistema completo de autenticación con JWT, Google OAuth, y gestión de sesiones.

## Características
- JWT con access/refresh tokens
- Google OAuth integrado
- Gestión de cookies seguras
- Middleware de protección de rutas
- Renovación automática de tokens

## Endpoints REST API

### 1. Registro de Usuario
```typescript
// POST /api/auth/register
const registrarUsuario = async (data: {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: 'ESTUDIANTE' | 'EMPRESA' | 'INSTITUCION';
}) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### 2. Login
```typescript
// POST /api/auth/login
const iniciarSesion = async (credentials: {
  email: string;
  password: string;
}) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include', // Para cookies
    body: JSON.stringify(credentials)
  });
  return response.json();
};
```

### 3. Google OAuth
```typescript
// GET /api/auth/google
const iniciarSesionConGoogle = () => {
  // Redirigir al endpoint de Google OAuth
  window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`;
};

// Callback - GET /api/auth/google/callback
// Se maneja automáticamente por el backend
```

### 4. Renovar Token
```typescript
// POST /api/auth/refresh
const renovarToken = async () => {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include' // Para enviar refresh token cookie
  });
  return response.json();
};
```

### 5. Logout
```typescript
// POST /api/auth/logout
const cerrarSesion = async () => {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  return response.json();
};
```

## Integración en Next.js

### 1. Context de Autenticación
```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token válido al cargar
    verificarAutenticacion();
  }, []);

  const verificarAutenticacion = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.data);
      } else {
        // Token inválido, intentar renovar
        await renovarToken();
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await iniciarSesion(credentials);

    if (response.success) {
      localStorage.setItem('accessToken', response.data.accessToken);
      setUser(response.data.user);
    } else {
      throw new Error(response.message);
    }
  };

  const logout = async () => {
    try {
      await cerrarSesion();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
```

### 2. HOC de Protección de Rutas
```typescript
// hocs/withAuth.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

export function withAuth<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  allowedRoles?: string[]
) {
  return function AuthenticatedComponent(props: T) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          router.push('/login');
          return;
        }

        if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
          router.push('/unauthorized');
          return;
        }
      }
    }, [user, loading, isAuthenticated, router]);

    if (loading) {
      return <div>Cargando...</div>;
    }

    if (!isAuthenticated) {
      return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
```

### 3. Hook de API con Autenticación
```typescript
// hooks/useApi.ts
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export const useApi = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const apiCall = async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers
        }
      });

      if (response.status === 401) {
        // Token expirado, intentar renovar
        try {
          const refreshResponse = await renovarToken();
          if (refreshResponse.success) {
            localStorage.setItem('accessToken', refreshResponse.data.accessToken);

            // Reintentar la petición original
            return await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`, {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshResponse.data.accessToken}`,
                ...options.headers
              }
            });
          } else {
            logout();
            throw new Error('Sesión expirada');
          }
        } catch (error) {
          logout();
          throw new Error('Sesión expirada');
        }
      }

      return response;
    } finally {
      setLoading(false);
    }
  };

  return { apiCall, loading };
};
```

### 4. Página de Login
```typescript
// pages/login.tsx
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(credentials);
      router.push('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    iniciarSesionConGoogle();
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h1>Iniciar Sesión</h1>

        {error && <div className="error">{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={credentials.email}
          onChange={(e) => setCredentials(prev => ({
            ...prev,
            email: e.target.value
          }))}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={credentials.password}
          onChange={(e) => setCredentials(prev => ({
            ...prev,
            password: e.target.value
          }))}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Cargando...' : 'Iniciar Sesión'}
        </button>

        <button type="button" onClick={handleGoogleLogin}>
          Continuar con Google
        </button>
      </form>
    </div>
  );
}
```

### 5. Middleware de Next.js
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('refreshToken')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                    request.nextUrl.pathname.startsWith('/register');
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/profile');

  // Redirigir a dashboard si ya está autenticado y trata de acceder a login/register
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirigir a login si no está autenticado y trata de acceder a páginas protegidas
  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/login', '/register']
};
```

## Tipos TypeScript

```typescript
// types/auth.ts
export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'ESTUDIANTE' | 'EMPRESA' | 'INSTITUCION';
  avatar?: string;
  emailVerificado: boolean;
  perfilCompleto: boolean;
  fechaCreacion: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: 'ESTUDIANTE' | 'EMPRESA' | 'INSTITUCION';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
  };
}
```

## Variables de Entorno

```env
# Next.js (.env.local)
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## Consideraciones de Seguridad

1. **HTTPS**: Usar HTTPS en producción
2. **SameSite Cookies**: Configurar cookies con SameSite para CSRF
3. **Token Storage**: Considerar almacenamiento seguro de tokens
4. **Renovación Automática**: Implementar renovación automática de tokens
5. **Logout Seguro**: Limpiar todos los tokens al cerrar sesión