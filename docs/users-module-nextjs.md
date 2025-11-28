# Módulo de Usuarios - Guía de Integración Next.js

## Descripción
Sistema completo de gestión de usuarios con perfiles diferenciados, sistema social y autenticación.

## Características
- Perfiles de estudiantes, empresas e instituciones
- Sistema de seguimiento (follow/unfollow)
- Búsqueda avanzada con filtros
- Gestión de avatares y archivos
- Validaciones robustas

## Endpoints REST API

### 1. Obtener Perfil Propio
```typescript
// GET /api/users/me
const obtenerMiPerfil = async () => {
  const response = await fetch('/api/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 2. Obtener Perfil de Usuario
```typescript
// GET /api/users/:id
const obtenerPerfilUsuario = async (userId: string) => {
  const response = await fetch(`/api/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 3. Actualizar Perfil de Usuario
```typescript
// PUT /api/users/profile
const actualizarPerfil = async (data: {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  biografia?: string;
  ubicacion?: string;
}) => {
  const response = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### 4. Actualizar Perfil de Estudiante
```typescript
// PUT /api/users/student/profile
const actualizarPerfilEstudiante = async (data: {
  carrera?: string;
  universidad?: string;
  anio_ingreso?: number;
  anio_egreso?: number;
  habilidades?: string[];
  experiencia?: ExperienciaLaboral[]; // JSON array of work experiences
  telefono?: string;
  portafolio?: string;
  linkedin?: string;
  github?: string;
  ubicacion?: string;
}) => {
  const response = await fetch('/api/users/student/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

// Ejemplo de estructura JSON para experiencia laboral
const ejemploExperiencia = [
  {
    id: "1",
    empresa: "Tech Solutions S.A.",
    puesto: "Desarrollador Frontend Junior",
    descripcion: "Desarrollo de interfaces de usuario con React y TypeScript",
    fechaInicio: "2023-01-15",
    fechaFin: "2023-12-20",
    esTrabajoActual: false,
    ubicacion: "Lima, Perú",
    tipo: "TIEMPO_COMPLETO",
    habilidades: ["React", "TypeScript", "CSS", "Git"]
  },
  {
    id: "2",
    empresa: "Startup Innovation",
    puesto: "Desarrollador Full Stack",
    descripcion: "Desarrollo de aplicaciones web completas usando MERN stack",
    fechaInicio: "2024-01-10",
    fechaFin: null, // Trabajo actual
    esTrabajoActual: true,
    ubicacion: "Remoto",
    tipo: "TIEMPO_COMPLETO",
    habilidades: ["React", "Node.js", "MongoDB", "Express"]
  }
];
```

### 5. Subir Avatar
```typescript
// POST /api/users/avatar (con archivo)
const subirAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch('/api/users/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};
```

### 6. Seguir Usuario
```typescript
// POST /api/users/:id/follow
const seguirUsuario = async (userId: string) => {
  const response = await fetch(`/api/users/${userId}/follow`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 7. Dejar de Seguir Usuario
```typescript
// DELETE /api/users/:id/follow
const dejarDeSeguirUsuario = async (userId: string) => {
  const response = await fetch(`/api/users/${userId}/follow`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 8. Buscar Usuarios
```typescript
// GET /api/users/search
const buscarUsuarios = async (filtros: {
  query?: string;
  rol?: 'ESTUDIANTE' | 'EMPRESA' | 'INSTITUCION';
  ubicacion?: string;
  carrera?: string;
  universidad?: string;
  habilidades?: string[];
  page?: number;
  limit?: number;
}) => {
  const searchParams = new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });

  const response = await fetch(`/api/users/search?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

## Integración en Next.js

### 1. Hook de Perfil de Usuario
```typescript
// hooks/useUserProfile.ts
import { useState, useEffect } from 'react';
import { useApi } from './useApi';

export const useUserProfile = (userId?: string) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const { apiCall } = useApi();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const endpoint = userId ? `/api/users/${userId}` : '/api/users/me';
      const response = await apiCall(endpoint);
      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setFollowing(data.data.isFollowing || false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      const response = await apiCall('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Error updating profile' };
    }
  };

  const toggleFollow = async () => {
    if (!userId) return;

    try {
      const method = following ? 'DELETE' : 'POST';
      const response = await apiCall(`/api/users/${userId}/follow`, {
        method
      });

      const data = await response.json();
      if (data.success) {
        setFollowing(!following);
        // Actualizar contadores en el perfil
        setProfile(prev => prev ? {
          ...prev,
          _count: {
            ...prev._count,
            seguidores: following
              ? prev._count.seguidores - 1
              : prev._count.seguidores + 1
          }
        } : null);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  return {
    profile,
    loading,
    following,
    updateProfile,
    toggleFollow,
    refetch: fetchProfile
  };
};
```

### 2. Hook de Búsqueda de Usuarios
```typescript
// hooks/useUserSearch.ts
import { useState, useEffect } from 'react';
import { useApi } from './useApi';

interface SearchFilters {
  query?: string;
  rol?: string;
  ubicacion?: string;
  carrera?: string;
  universidad?: string;
  habilidades?: string[];
}

export const useUserSearch = (initialFilters: SearchFilters = {}) => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [loading, setLoading] = useState(false);
  const { apiCall } = useApi();

  const searchUsers = async (newFilters = filters, page = 1) => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('page', page.toString());
      searchParams.append('limit', '20');

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(item => searchParams.append(key, item));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });

      const response = await apiCall(`/api/users/search?${searchParams}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.usuarios);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    searchUsers(newFilters, 1);
  };

  const changePage = (page: number) => {
    searchUsers(filters, page);
  };

  useEffect(() => {
    searchUsers();
  }, []);

  return {
    users,
    filters,
    pagination,
    loading,
    applyFilters,
    changePage,
    refetch: () => searchUsers(filters, pagination.currentPage)
  };
};
```

### 3. Componente de Perfil de Usuario
```typescript
// components/UserProfile.tsx
import { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfileProps {
  userId?: string; // Si no se proporciona, muestra el perfil propio
}

export default function UserProfile({ userId }: UserProfileProps) {
  const { user: currentUser } = useAuth();
  const { profile, loading, following, updateProfile, toggleFollow } = useUserProfile(userId);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const isOwnProfile = !userId || currentUser?.id === userId;
  const isStudent = profile?.rol === 'ESTUDIANTE';
  const isCompany = profile?.rol === 'EMPRESA';

  const handleEdit = () => {
    setEditData({
      nombre: profile?.nombre || '',
      apellido: profile?.apellido || '',
      biografia: profile?.biografia || '',
      telefono: profile?.telefono || '',
      ubicacion: profile?.ubicacion || ''
    });
    setEditing(true);
  };

  const handleSave = async () => {
    const result = await updateProfile(editData);
    if (result.success) {
      setEditing(false);
      alert('Perfil actualizado exitosamente');
    } else {
      alert(result.message || 'Error al actualizar perfil');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await subirAvatar(file);
      if (response.success) {
        // Actualizar avatar en el perfil
        window.location.reload(); // Simplificado, mejor usar state
      }
    } catch (error) {
      alert('Error al subir avatar');
    }
  };

  if (loading) return <div>Cargando perfil...</div>;
  if (!profile) return <div>Perfil no encontrado</div>;

  return (
    <div className="user-profile max-w-4xl mx-auto p-6">
      {/* Header del perfil */}
      <div className="profile-header bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={profile.avatar || '/default-avatar.jpg'}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover"
            />
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer">
                📷
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex-1">
            {editing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editData.nombre}
                  onChange={(e) => setEditData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre"
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  value={editData.apellido}
                  onChange={(e) => setEditData(prev => ({ ...prev, apellido: e.target.value }))}
                  placeholder="Apellido"
                  className="border rounded px-3 py-2"
                />
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold">
                  {profile.nombre} {profile.apellido}
                </h1>
                <p className="text-gray-600">{profile.email}</p>
                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {profile.rol}
                </span>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            {isOwnProfile ? (
              editing ? (
                <>
                  <button onClick={handleSave} className="btn-primary">
                    Guardar
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-secondary">
                    Cancelar
                  </button>
                </>
              ) : (
                <button onClick={handleEdit} className="btn-primary">
                  Editar Perfil
                </button>
              )
            ) : (
              <button
                onClick={toggleFollow}
                className={`btn ${following ? 'btn-secondary' : 'btn-primary'}`}
              >
                {following ? 'Siguiendo' : 'Seguir'}
              </button>
            )}
          </div>
        </div>

        {/* Biografía */}
        <div className="mt-4">
          {editing ? (
            <textarea
              value={editData.biografia}
              onChange={(e) => setEditData(prev => ({ ...prev, biografia: e.target.value }))}
              placeholder="Biografía"
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          ) : (
            profile.biografia && (
              <p className="text-gray-700">{profile.biografia}</p>
            )
          )}
        </div>

        {/* Estadísticas */}
        <div className="flex space-x-6 mt-4 text-center">
          <div>
            <div className="font-bold text-lg">{profile._count?.seguidores || 0}</div>
            <div className="text-gray-600 text-sm">Seguidores</div>
          </div>
          <div>
            <div className="font-bold text-lg">{profile._count?.siguiendo || 0}</div>
            <div className="text-gray-600 text-sm">Siguiendo</div>
          </div>
          {isStudent && (
            <div>
              <div className="font-bold text-lg">{profile._count?.postulaciones || 0}</div>
              <div className="text-gray-600 text-sm">Postulaciones</div>
            </div>
          )}
        </div>
      </div>

      {/* Información específica por rol */}
      {isStudent && profile.estudiante && (
        <StudentProfileDetails
          student={profile.estudiante}
          isOwnProfile={isOwnProfile}
        />
      )}

      {isCompany && profile.empresa && (
        <CompanyProfileDetails
          company={profile.empresa}
          isOwnProfile={isOwnProfile}
        />
      )}
    </div>
  );
}
```

### 4. Componente de Búsqueda de Usuarios
```typescript
// components/UserSearch.tsx
import { useState } from 'react';
import { useUserSearch } from '@/hooks/useUserSearch';

const ROLES = [
  { value: '', label: 'Todos los roles' },
  { value: 'ESTUDIANTE', label: 'Estudiantes' },
  { value: 'EMPRESA', label: 'Empresas' },
  { value: 'INSTITUCION', label: 'Instituciones' }
];

export default function UserSearch() {
  const { users, filters, pagination, loading, applyFilters, changePage } = useUserSearch();
  const [searchForm, setSearchForm] = useState(filters);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchForm);
  };

  const handleInputChange = (field: string, value: any) => {
    setSearchForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="user-search max-w-6xl mx-auto p-6">
      {/* Formulario de búsqueda */}
      <div className="search-form bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchForm.query || ''}
              onChange={(e) => handleInputChange('query', e.target.value)}
              className="border rounded px-3 py-2"
            />

            <select
              value={searchForm.rol || ''}
              onChange={(e) => handleInputChange('rol', e.target.value)}
              className="border rounded px-3 py-2"
            >
              {ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Ubicación"
              value={searchForm.ubicacion || ''}
              onChange={(e) => handleInputChange('ubicacion', e.target.value)}
              className="border rounded px-3 py-2"
            />

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {searchForm.rol === 'ESTUDIANTE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <input
                type="text"
                placeholder="Carrera"
                value={searchForm.carrera || ''}
                onChange={(e) => handleInputChange('carrera', e.target.value)}
                className="border rounded px-3 py-2"
              />

              <input
                type="text"
                placeholder="Universidad"
                value={searchForm.universidad || ''}
                onChange={(e) => handleInputChange('universidad', e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
          )}
        </form>
      </div>

      {/* Resultados */}
      <div className="search-results">
        {loading ? (
          <div className="text-center py-8">Buscando usuarios...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user: any) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="pagination flex justify-center mt-8 space-x-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => changePage(page)}
                    className={`px-3 py-2 rounded ${
                      page === pagination.currentPage
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

### 5. Tarjeta de Usuario
```typescript
// components/UserCard.tsx
import Link from 'next/link';

interface UserCardProps {
  user: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    avatar?: string;
    biografia?: string;
    ubicacion?: string;
    estudiante?: {
      carrera?: string;
      universidad?: string;
      habilidades: string[];
    };
    empresa?: {
      nombre: string;
      industria?: string;
    };
    _count: {
      seguidores: number;
      siguiendo: number;
    };
  };
}

export default function UserCard({ user }: UserCardProps) {
  const getDisplayName = () => {
    if (user.rol === 'EMPRESA' && user.empresa) {
      return user.empresa.nombre;
    }
    return `${user.nombre} ${user.apellido}`;
  };

  const getSubtitle = () => {
    if (user.rol === 'ESTUDIANTE' && user.estudiante) {
      const carrera = user.estudiante.carrera;
      const universidad = user.estudiante.universidad;
      if (carrera && universidad) {
        return `${carrera} - ${universidad}`;
      } else if (carrera) {
        return carrera;
      }
    } else if (user.rol === 'EMPRESA' && user.empresa?.industria) {
      return user.empresa.industria;
    }
    return user.email;
  };

  return (
    <Link href={`/users/${user.id}`}>
      <div className="user-card bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer">
        <div className="flex items-center space-x-4 mb-4">
          <img
            src={user.avatar || '/default-avatar.jpg'}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="font-bold text-lg">{getDisplayName()}</h3>
            <p className="text-gray-600 text-sm">{getSubtitle()}</p>
            <span className={`inline-block px-2 py-1 rounded text-xs ${
              user.rol === 'ESTUDIANTE' ? 'bg-blue-100 text-blue-800' :
              user.rol === 'EMPRESA' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {user.rol}
            </span>
          </div>
        </div>

        {user.biografia && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-2">
            {user.biografia}
          </p>
        )}

        {user.ubicacion && (
          <p className="text-gray-500 text-sm mb-4">
            📍 {user.ubicacion}
          </p>
        )}

        {/* Habilidades para estudiantes */}
        {user.rol === 'ESTUDIANTE' && user.estudiante?.habilidades && (
          <div className="flex flex-wrap gap-1 mb-4">
            {user.estudiante.habilidades.slice(0, 3).map((habilidad, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                {habilidad}
              </span>
            ))}
            {user.estudiante.habilidades.length > 3 && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                +{user.estudiante.habilidades.length - 3} más
              </span>
            )}
          </div>
        )}

        {/* Estadísticas */}
        <div className="flex justify-between text-sm text-gray-500">
          <span>{user._count.seguidores} seguidores</span>
          <span>{user._count.siguiendo} siguiendo</span>
        </div>
      </div>
    </Link>
  );
}
```

## Tipos TypeScript

```typescript
// types/users.ts

// Estructura para experiencias laborales (campo JSON)
export interface ExperienciaLaboral {
  id?: string;
  empresa: string;
  puesto: string;
  descripcion?: string;
  fechaInicio: string; // YYYY-MM-DD format
  fechaFin?: string; // YYYY-MM-DD format, null if current job
  esTrabajoActual?: boolean;
  ubicacion?: string;
  tipo?: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'FREELANCE' | 'PRACTICAS' | 'VOLUNTARIADO';
  habilidades?: string[];
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'ESTUDIANTE' | 'EMPRESA' | 'INSTITUCION';
  avatar?: string;
  telefono?: string;
  biografia?: string;
  ubicacion?: string;
  emailVerificado: boolean;
  perfilCompleto: boolean;
  fechaCreacion: Date;
  estudiante?: PerfilEstudiante;
  empresa?: PerfilEmpresa;
  institucion?: PerfilInstitucion;
  _count: {
    seguidores: number;
    siguiendo: number;
    postulaciones?: number;
    ofertas?: number;
  };
}

export interface PerfilEstudiante {
  carrera?: string;
  universidad?: string;
  anio_ingreso?: number;
  anio_egreso?: number;
  telefono?: string;
  habilidades: string[];
  experiencia?: ExperienciaLaboral[]; // JSON array of work experiences
  portafolio?: string;
  linkedin?: string;
  github?: string;
  ubicacion?: string;
  cv?: string; // URL del CV
}

export interface PerfilEmpresa {
  nombre: string;
  ruc?: string;
  industria?: string;
  descripcion?: string;
  sitioWeb?: string;
  tamanio?: string;
  logo?: string;
}
```

## Variables de Entorno

```env
# Next.js (.env.local)
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## Consideraciones

1. **Autorización**: Validar permisos para editar perfiles
2. **Upload de archivos**: Manejar subida de avatars y CVs
3. **Privacidad**: Respetar configuraciones de privacidad
4. **Validación**: Validar formularios en frontend y backend
5. **Cache**: Implementar cache para perfiles frecuentemente visitados