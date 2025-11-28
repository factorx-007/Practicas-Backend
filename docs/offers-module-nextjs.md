# Módulo de Ofertas - Guía de Integración Next.js

## Descripción
Sistema completo de gestión de ofertas laborales con postulaciones, filtros avanzados y estadísticas.

## Características
- CRUD completo de ofertas
- Sistema de postulaciones
- Filtros avanzados de búsqueda
- Gestión de estados de aplicaciones
- Analytics y estadísticas
- Validaciones robustas

## Endpoints REST API

### 1. Crear Oferta (Solo Empresas)
```typescript
// POST /api/offers
const crearOferta = async (data: {
  titulo: string;
  descripcion: string;
  requisitos: string[];
  ubicacion: string;
  modalidad: 'PRESENCIAL' | 'REMOTO' | 'HIBRIDO';
  tipoContrato: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'PRACTICAS' | 'FREELANCE';
  salarioMin?: number;
  salarioMax?: number;
  beneficios?: string[];
  fechaLimite?: string;
  habilidadesRequeridas?: string[];
}) => {
  const response = await fetch('/api/offers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### 2. Buscar Ofertas con Filtros
```typescript
// GET /api/offers/search
const buscarOfertas = async (filtros: {
  query?: string;
  ubicacion?: string;
  modalidad?: string;
  tipoContrato?: string;
  salarioMin?: number;
  salarioMax?: number;
  empresaId?: string;
  habilidades?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

  const response = await fetch(`/api/offers/search?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 3. Obtener Oferta por ID
```typescript
// GET /api/offers/:id
const obtenerOferta = async (id: string) => {
  const response = await fetch(`/api/offers/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 4. Postular a Oferta (Solo Estudiantes)
```typescript
// POST /api/offers/:id/apply
const postularOferta = async (offerId: string, data: {
  cartaPresentacion?: string;
  cvUrl?: string;
}) => {
  const response = await fetch(`/api/offers/${offerId}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### 5. Gestionar Postulaciones (Solo Empresas)
```typescript
// PUT /api/offers/applications/:id/status
const actualizarEstadoPostulacion = async (
  applicationId: string,
  estado: 'PENDIENTE' | 'REVISADO' | 'ACEPTADO' | 'RECHAZADO'
) => {
  const response = await fetch(`/api/offers/applications/${applicationId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ estado })
  });
  return response.json();
};
```

### 6. Obtener Postulaciones de una Oferta
```typescript
// GET /api/offers/:id/applications
const obtenerPostulaciones = async (offerId: string, page = 1, limit = 20) => {
  const response = await fetch(
    `/api/offers/${offerId}/applications?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
};
```

## Integración en Next.js

### 1. Hook de Ofertas
```typescript
// hooks/useOfertas.ts
import { useState, useEffect } from 'react';
import { useApi } from './useApi';

interface FiltrosOferta {
  query?: string;
  ubicacion?: string;
  modalidad?: string;
  tipoContrato?: string;
  salarioMin?: number;
  salarioMax?: number;
  habilidades?: string[];
}

export const useOfertas = (filtrosIniciales: FiltrosOferta = {}) => {
  const [ofertas, setOfertas] = useState([]);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [loading, setLoading] = useState(false);
  const { apiCall } = useApi();

  const buscarOfertas = async (nuevosFiltros = filtros, page = 1) => {
    setLoading(true);
    try {
      const response = await apiCall('/api/offers/search', {
        method: 'GET'
      });

      const data = await response.json();
      if (data.success) {
        setOfertas(data.data.ofertas);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error buscando ofertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = (nuevosFiltros: FiltrosOferta) => {
    setFiltros(nuevosFiltros);
    buscarOfertas(nuevosFiltros, 1);
  };

  const cambiarPagina = (page: number) => {
    buscarOfertas(filtros, page);
  };

  useEffect(() => {
    buscarOfertas();
  }, []);

  return {
    ofertas,
    filtros,
    pagination,
    loading,
    aplicarFiltros,
    cambiarPagina,
    refetch: () => buscarOfertas(filtros, pagination.currentPage)
  };
};
```

### 2. Componente de Búsqueda de Ofertas
```typescript
// components/BusquedaOfertas.tsx
import { useState } from 'react';
import { useOfertas } from '@/hooks/useOfertas';

const MODALIDADES = [
  { value: '', label: 'Todas las modalidades' },
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'REMOTO', label: 'Remoto' },
  { value: 'HIBRIDO', label: 'Híbrido' }
];

const TIPOS_CONTRATO = [
  { value: '', label: 'Todos los tipos' },
  { value: 'TIEMPO_COMPLETO', label: 'Tiempo completo' },
  { value: 'MEDIO_TIEMPO', label: 'Medio tiempo' },
  { value: 'PRACTICAS', label: 'Prácticas' },
  { value: 'FREELANCE', label: 'Freelance' }
];

export default function BusquedaOfertas() {
  const { ofertas, filtros, pagination, loading, aplicarFiltros, cambiarPagina } = useOfertas();
  const [filtrosForm, setFiltrosForm] = useState(filtros);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    aplicarFiltros(filtrosForm);
  };

  const handleInputChange = (field: string, value: any) => {
    setFiltrosForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="busqueda-ofertas">
      {/* Formulario de filtros */}
      <form onSubmit={handleSubmit} className="filtros">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar ofertas..."
            value={filtrosForm.query || ''}
            onChange={(e) => handleInputChange('query', e.target.value)}
          />

          <input
            type="text"
            placeholder="Ubicación"
            value={filtrosForm.ubicacion || ''}
            onChange={(e) => handleInputChange('ubicacion', e.target.value)}
          />

          <select
            value={filtrosForm.modalidad || ''}
            onChange={(e) => handleInputChange('modalidad', e.target.value)}
          >
            {MODALIDADES.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filtrosForm.tipoContrato || ''}
            onChange={(e) => handleInputChange('tipoContrato', e.target.value)}
          >
            {TIPOS_CONTRATO.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <input
            type="number"
            placeholder="Salario mínimo"
            value={filtrosForm.salarioMin || ''}
            onChange={(e) => handleInputChange('salarioMin', parseInt(e.target.value) || undefined)}
          />

          <input
            type="number"
            placeholder="Salario máximo"
            value={filtrosForm.salarioMax || ''}
            onChange={(e) => handleInputChange('salarioMax', parseInt(e.target.value) || undefined)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar Ofertas'}
        </button>
      </form>

      {/* Lista de ofertas */}
      <div className="ofertas-lista">
        {loading ? (
          <div>Cargando ofertas...</div>
        ) : (
          <>
            {ofertas.map((oferta: any) => (
              <OfertaCard key={oferta.id} oferta={oferta} />
            ))}

            {/* Paginación */}
            <div className="paginacion">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => cambiarPagina(page)}
                  className={page === pagination.currentPage ? 'active' : ''}
                >
                  {page}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

### 3. Tarjeta de Oferta
```typescript
// components/OfertaCard.tsx
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';

interface OfertaCardProps {
  oferta: {
    id: string;
    titulo: string;
    descripcion: string;
    ubicacion: string;
    modalidad: string;
    tipoContrato: string;
    salarioMin?: number;
    salarioMax?: number;
    empresa: {
      id: string;
      nombre: string;
      logo?: string;
    };
    fechaCreacion: string;
    fechaLimite?: string;
    habilidadesRequeridas: string[];
    _count: {
      postulaciones: number;
    };
  };
}

export default function OfertaCard({ oferta }: OfertaCardProps) {
  const { user } = useAuth();
  const { apiCall } = useApi();
  const [postulando, setPostulando] = useState(false);
  const [yaPostulado, setYaPostulado] = useState(false);

  const handlePostular = async () => {
    if (!user || user.rol !== 'ESTUDIANTE') return;

    setPostulando(true);
    try {
      const response = await apiCall(`/api/offers/${oferta.id}/apply`, {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        setYaPostulado(true);
        alert('¡Postulación enviada exitosamente!');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error al postular');
    } finally {
      setPostulando(false);
    }
  };

  const formatSalario = () => {
    if (oferta.salarioMin && oferta.salarioMax) {
      return `S/. ${oferta.salarioMin.toLocaleString()} - S/. ${oferta.salarioMax.toLocaleString()}`;
    } else if (oferta.salarioMin) {
      return `Desde S/. ${oferta.salarioMin.toLocaleString()}`;
    }
    return 'Salario a convenir';
  };

  return (
    <div className="oferta-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{oferta.titulo}</h3>
          <p className="text-gray-600">{oferta.empresa.nombre}</p>
        </div>
        {oferta.empresa.logo && (
          <img
            src={oferta.empresa.logo}
            alt={oferta.empresa.nombre}
            className="w-12 h-12 rounded"
          />
        )}
      </div>

      <p className="text-gray-700 mb-4 line-clamp-3">
        {oferta.descripcion}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="badge">{oferta.modalidad}</span>
        <span className="badge">{oferta.tipoContrato}</span>
        <span className="badge">{oferta.ubicacion}</span>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {oferta.habilidadesRequeridas.slice(0, 5).map((habilidad, index) => (
          <span key={index} className="skill-tag">
            {habilidad}
          </span>
        ))}
        {oferta.habilidadesRequeridas.length > 5 && (
          <span className="skill-tag">
            +{oferta.habilidadesRequeridas.length - 5} más
          </span>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold">{formatSalario()}</p>
          <p className="text-sm text-gray-500">
            {oferta._count.postulaciones} postulaciones
          </p>
        </div>

        {user?.rol === 'ESTUDIANTE' && (
          <button
            onClick={handlePostular}
            disabled={postulando || yaPostulado}
            className={`btn ${yaPostulado ? 'btn-success' : 'btn-primary'}`}
          >
            {yaPostulado ? 'Postulado ✓' : postulando ? 'Postulando...' : 'Postular'}
          </button>
        )}
      </div>

      {oferta.fechaLimite && (
        <p className="text-sm text-red-500 mt-2">
          Cierra: {new Date(oferta.fechaLimite).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
```

## Tipos TypeScript

```typescript
// types/offers.ts
export interface Oferta {
  id: string;
  titulo: string;
  descripcion: string;
  requisitos: string[];
  ubicacion: string;
  modalidad: 'PRESENCIAL' | 'REMOTO' | 'HIBRIDO';
  tipoContrato: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'PRACTICAS' | 'FREELANCE';
  salarioMin?: number;
  salarioMax?: number;
  beneficios: string[];
  fechaLimite?: Date;
  habilidadesRequeridas: string[];
  empresa: {
    id: string;
    nombre: string;
    logo?: string;
  };
  fechaCreacion: Date;
  activa: boolean;
  _count: {
    postulaciones: number;
  };
}

export interface Postulacion {
  id: string;
  estudianteId: string;
  ofertaId: string;
  estado: 'PENDIENTE' | 'REVISADO' | 'ACEPTADO' | 'RECHAZADO';
  cartaPresentacion?: string;
  cvUrl?: string;
  fechaPostulacion: Date;
  estudiante: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    avatar?: string;
  };
}
```

## Variables de Entorno

```env
# Next.js (.env.local)
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## Consideraciones

1. **Autorización**: Solo empresas pueden crear ofertas
2. **Validación**: Validar formularios en frontend y backend
3. **Filtros**: Implementar filtros avanzados para mejor UX
4. **Paginación**: Manejar grandes volúmenes de ofertas
5. **SEO**: Optimizar URLs y meta datos para ofertas