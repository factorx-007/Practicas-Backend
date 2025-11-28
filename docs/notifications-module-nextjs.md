# Módulo de Notificaciones - Guía de Integración Next.js

## Descripción
Sistema completo de notificaciones en tiempo real con Socket.IO, MongoDB y REST API. Incluye notificaciones in-app, por email, push notifications y configuración personalizada por usuario.

## Arquitectura
- **Base de datos**: MongoDB (notificaciones) + PostgreSQL (usuarios)
- **Tiempo real**: Socket.IO con namespace dedicado
- **REST API**: Express.js con validaciones completas
- **Canales múltiples**: In-app, email, push, SMS
- **Configuración avanzada**: Horarios, prioridades, filtros

## Endpoints REST API

### 1. Crear Notificación Individual
```typescript
// POST /api/notifications
const crearNotificacion = async (data: {
  titulo: string;
  mensaje: string;
  tipo: 'NUEVA_OFERTA' | 'POSTULACION' | 'MENSAJE' | 'REACCION' | 'COMENTARIO' | 'SEGUIMIENTO' | 'ACTUALIZACION_PERFIL' | 'SISTEMA';
  destinatarioId: string;
  remitenteId?: string;
  prioridad?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  canales?: ('IN_APP' | 'EMAIL' | 'PUSH' | 'SMS')[];
  programada?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  acciones?: {
    id: string;
    texto: string;
    tipo: 'PRIMARY' | 'SECONDARY' | 'DANGER';
    url?: string;
    metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: Record<string, any>;
  }[];
}) => {
  const response = await fetch('/api/notifications', {
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

### 2. Crear Notificaciones Masivas
```typescript
// POST /api/notifications/bulk
const crearNotificacionesMasivas = async (data: {
  titulo: string;
  mensaje: string;
  tipo: string;
  destinatarioIds: string[];
  prioridad?: string;
  canales?: string[];
}) => {
  const response = await fetch('/api/notifications/bulk', {
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

### 3. Obtener Notificaciones del Usuario
```typescript
// GET /api/notifications/my
const obtenerMisNotificaciones = async (params: {
  page?: number;
  limit?: number;
  tipo?: string;
  estado?: 'PENDING' | 'SENT' | 'READ' | 'FAILED';
  prioridad?: string;
  leida?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda?: string;
} = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/notifications/my?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 4. Marcar como Leída
```typescript
// PATCH /api/notifications/:id/read
const marcarComoLeida = async (notificationId: string) => {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 5. Marcar Todas como Leídas
```typescript
// PATCH /api/notifications/mark-all-read
const marcarTodasComoLeidas = async () => {
  const response = await fetch('/api/notifications/mark-all-read', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 6. Obtener Estadísticas
```typescript
// GET /api/notifications/stats
const obtenerEstadisticas = async () => {
  const response = await fetch('/api/notifications/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 7. Configuración de Notificaciones
```typescript
// GET /api/notifications/settings/my
const obtenerConfiguracion = async () => {
  const response = await fetch('/api/notifications/settings/my', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// PATCH /api/notifications/settings/my
const actualizarConfiguracion = async (data: {
  configuracion?: Record<string, any>;
  noMolestar?: boolean;
  horarioNoMolestarDesde?: string;
  horarioNoMolestarHasta?: string;
  diasNoMolestar?: number[];
}) => {
  const response = await fetch('/api/notifications/settings/my', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

## Integración Socket.IO en Next.js

### 1. Configuración del Cliente
```typescript
// lib/notifications-socket.ts
import { io, Socket } from 'socket.io-client';

class NotificationsSocketManager {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications`, {
      auth: { token },
      transports: ['websocket']
    });

    this.setupEventListeners();
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Conectado a notificaciones');
      // Unirse automáticamente al canal de notificaciones
      this.socket?.emit('join_notifications');
    });

    this.socket.on('notifications_joined', (data) => {
      console.log('Unido al canal de notificaciones:', data);
    });

    this.socket.on('notification_error', (error) => {
      console.error('Error de socket de notificaciones:', error);
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado de notificaciones');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.emit('leave_notifications');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const notificationsSocketManager = new NotificationsSocketManager();
```

### 2. Hook de Notificaciones
```typescript
// hooks/useNotifications.ts
import { useEffect, useState, useCallback } from 'react';
import { notificationsSocketManager } from '@/lib/notifications-socket';

interface Notification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  destinatarioId: string;
  remitenteId?: string;
  remitenteNombre?: string;
  remitenteAvatar?: string;
  estado: string;
  prioridad: string;
  canales: string[];
  leida: boolean;
  fechaLectura?: Date;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  metadata?: Record<string, any>;
  acciones?: any[];
}

interface NotificationStats {
  total: number;
  noLeidas: number;
  porTipo: Record<string, number>;
  porEstado: Record<string, number>;
  porPrioridad: Record<string, number>;
  hoy: number;
  estaSemana: number;
  esteMes: number;
}

export const useNotifications = (token: string) => {
  const [notificaciones, setNotificaciones] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = notificationsSocketManager.connect(token);

    // Eventos de conexión
    socket.on('connect', () => setConectado(true));
    socket.on('disconnect', () => setConectado(false));

    // Eventos de notificaciones
    socket.on('new_notification', (notification: Notification) => {
      setNotificaciones(prev => [notification, ...prev]);

      // Mostrar notificación del navegador si está permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.titulo, {
          body: notification.mensaje,
          icon: '/icon-192x192.png',
          tag: notification.id
        });
      }
    });

    socket.on('notification_updated', (notification: Notification) => {
      setNotificaciones(prev =>
        prev.map(n => n.id === notification.id ? notification : n)
      );
    });

    socket.on('notification_deleted', (data: { notificationId: string }) => {
      setNotificaciones(prev =>
        prev.filter(n => n.id !== data.notificationId)
      );
    });

    socket.on('notifications_marked_read', (data: { count: number }) => {
      setNotificaciones(prev =>
        prev.map(n => ({ ...n, leida: true, fechaLectura: new Date() }))
      );
    });

    socket.on('notification_stats_updated', (newStats: NotificationStats) => {
      setStats(newStats);
    });

    return () => {
      notificationsSocketManager.disconnect();
    };
  }, [token]);

  // Funciones para interactuar con notificaciones
  const marcarComoLeida = useCallback((notificationId: string) => {
    const socket = notificationsSocketManager.getSocket();
    if (socket) {
      socket.emit('mark_notification_read', notificationId);
    }
  }, []);

  const marcarTodasComoLeidas = useCallback(() => {
    const socket = notificationsSocketManager.getSocket();
    if (socket) {
      socket.emit('mark_all_notifications_read');
    }
  }, []);

  const eliminarNotificacion = useCallback((notificationId: string) => {
    const socket = notificationsSocketManager.getSocket();
    if (socket) {
      socket.emit('delete_notification', notificationId);
    }
  }, []);

  const solicitarEstadisticas = useCallback(() => {
    const socket = notificationsSocketManager.getSocket();
    if (socket) {
      socket.emit('request_notification_stats');
    }
  }, []);

  return {
    notificaciones,
    stats,
    conectado,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    solicitarEstadisticas
  };
};
```

### 3. Componente de Centro de Notificaciones
```typescript
// components/NotificationCenter.tsx
import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { obtenerMisNotificaciones } from '@/lib/api/notifications';

interface NotificationCenterProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ token, isOpen, onClose }: NotificationCenterProps) {
  const {
    notificaciones: notificacionesSocket,
    stats,
    conectado,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion
  } = useNotifications(token);

  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo: '',
    leida: '',
    prioridad: ''
  });

  // Cargar notificaciones iniciales
  useEffect(() => {
    if (isOpen) {
      cargarNotificaciones();
    }
  }, [isOpen, filtros]);

  // Combinar notificaciones de la API con las de Socket.IO
  useEffect(() => {
    if (notificacionesSocket.length > 0) {
      setNotificaciones(prev => {
        const nuevas = notificacionesSocket.filter(
          socketNotif => !prev.some(apiNotif => apiNotif.id === socketNotif.id)
        );
        return [...nuevas, ...prev];
      });
    }
  }, [notificacionesSocket]);

  const cargarNotificaciones = async () => {
    setCargando(true);
    try {
      const response = await obtenerMisNotificaciones({
        limit: 50,
        ...filtros
      });

      if (response.success) {
        setNotificaciones(response.data.notificaciones);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleMarcarComoLeida = (notificationId: string) => {
    marcarComoLeida(notificationId);
    // También actualizar estado local
    setNotificaciones(prev =>
      prev.map(n => n.id === notificationId ? { ...n, leida: true } : n)
    );
  };

  const handleMarcarTodasComoLeidas = () => {
    marcarTodasComoLeidas();
    setNotificaciones(prev =>
      prev.map(n => ({ ...n, leida: true }))
    );
  };

  const handleEliminar = (notificationId: string) => {
    eliminarNotificacion(notificationId);
    setNotificaciones(prev =>
      prev.filter(n => n.id !== notificationId)
    );
  };

  const getNotificationIcon = (tipo: string) => {
    const icons = {
      NUEVA_OFERTA: '💼',
      POSTULACION: '📝',
      MENSAJE: '💬',
      REACCION: '❤️',
      COMENTARIO: '💭',
      SEGUIMIENTO: '👥',
      ACTUALIZACION_PERFIL: '👤',
      SISTEMA: '⚙️'
    };
    return icons[tipo] || '📢';
  };

  const getPriorityColor = (prioridad: string) => {
    const colors = {
      LOW: 'text-gray-500',
      NORMAL: 'text-blue-500',
      HIGH: 'text-orange-500',
      URGENT: 'text-red-500'
    };
    return colors[prioridad] || 'text-gray-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold">Notificaciones</h2>
              {conectado && <span className="h-2 w-2 bg-green-500 rounded-full"></span>}
              {!conectado && <span className="h-2 w-2 bg-red-500 rounded-full"></span>}
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {/* Estadísticas */}
          {stats && (
            <div className="mt-2 flex space-x-4 text-sm text-gray-600">
              <span>Total: {stats.total}</span>
              <span>No leídas: {stats.noLeidas}</span>
              <span>Hoy: {stats.hoy}</span>
            </div>
          )}

          {/* Filtros */}
          <div className="mt-4 space-y-2">
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full p-2 border rounded"
            >
              <option value="">Todos los tipos</option>
              <option value="NUEVA_OFERTA">Nueva Oferta</option>
              <option value="MENSAJE">Mensaje</option>
              <option value="SISTEMA">Sistema</option>
            </select>

            <div className="flex space-x-2">
              <select
                value={filtros.leida}
                onChange={(e) => setFiltros(prev => ({ ...prev, leida: e.target.value }))}
                className="flex-1 p-2 border rounded"
              >
                <option value="">Todas</option>
                <option value="false">No leídas</option>
                <option value="true">Leídas</option>
              </select>

              <button
                onClick={handleMarcarTodasComoLeidas}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Marcar todas
              </button>
            </div>
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="h-full overflow-y-auto pb-20">
          {cargando ? (
            <div className="p-4 text-center">Cargando...</div>
          ) : notificaciones.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No hay notificaciones
            </div>
          ) : (
            notificaciones.map((notification) => (
              <div
                key={notification.id}
                className={`border-b p-4 hover:bg-gray-50 ${
                  !notification.leida ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {getNotificationIcon(notification.tipo)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm truncate">
                        {notification.titulo}
                      </h4>
                      <span className={`text-xs ${getPriorityColor(notification.prioridad)}`}>
                        {notification.prioridad}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mt-1">
                      {notification.mensaje}
                    </p>

                    {notification.remitenteNombre && (
                      <p className="text-xs text-gray-500 mt-1">
                        De: {notification.remitenteNombre}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(notification.fechaCreacion).toLocaleString()}
                      </span>

                      <div className="flex space-x-2">
                        {!notification.leida && (
                          <button
                            onClick={() => handleMarcarComoLeida(notification.id)}
                            className="text-xs text-blue-500 hover:text-blue-700"
                          >
                            Marcar leída
                          </button>
                        )}

                        <button
                          onClick={() => handleEliminar(notification.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Acciones de la notificación */}
                    {notification.acciones && notification.acciones.length > 0 && (
                      <div className="mt-2 space-x-2">
                        {notification.acciones.map((accion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              if (accion.url) {
                                window.open(accion.url, '_blank');
                              }
                            }}
                            className={`px-3 py-1 text-xs rounded ${
                              accion.tipo === 'PRIMARY'
                                ? 'bg-blue-500 text-white'
                                : accion.tipo === 'DANGER'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {accion.texto}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

### 4. Componente de Configuración de Notificaciones
```typescript
// components/NotificationSettings.tsx
import { useState, useEffect } from 'react';
import { obtenerConfiguracion, actualizarConfiguracion } from '@/lib/api/notifications';

interface NotificationSettingsProps {
  token: string;
}

export default function NotificationSettings({ token }: NotificationSettingsProps) {
  const [configuracion, setConfiguracion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const response = await obtenerConfiguracion();
      if (response.success) {
        setConfiguracion(response.data);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleSave = async () => {
    setGuardando(true);
    try {
      const response = await actualizarConfiguracion(configuracion);
      if (response.success) {
        alert('Configuración guardada exitosamente');
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar configuración');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <div>Cargando configuración...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Configuración de Notificaciones</h2>

      {/* Modo no molestar */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Modo No Molestar</h3>

        <label className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            checked={configuracion?.noMolestar || false}
            onChange={(e) => setConfiguracion(prev => ({
              ...prev,
              noMolestar: e.target.checked
            }))}
          />
          <span>Activar modo no molestar</span>
        </label>

        {configuracion?.noMolestar && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Desde</label>
              <input
                type="time"
                value={configuracion?.horarioNoMolestarDesde || '22:00'}
                onChange={(e) => setConfiguracion(prev => ({
                  ...prev,
                  horarioNoMolestarDesde: e.target.value
                }))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hasta</label>
              <input
                type="time"
                value={configuracion?.horarioNoMolestarHasta || '08:00'}
                onChange={(e) => setConfiguracion(prev => ({
                  ...prev,
                  horarioNoMolestarHasta: e.target.value
                }))}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        )}
      </div>

      {/* Configuración por tipo de notificación */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Tipos de Notificación</h3>

        {configuracion?.configuracion && Object.entries(configuracion.configuracion).map(([tipo, config]) => (
          <div key={tipo} className="p-4 border rounded-lg mb-4">
            <h4 className="font-medium mb-3">{tipo.replace('_', ' ')}</h4>

            <label className="flex items-center space-x-2 mb-3">
              <input
                type="checkbox"
                checked={config.habilitado}
                onChange={(e) => setConfiguracion(prev => ({
                  ...prev,
                  configuracion: {
                    ...prev.configuracion,
                    [tipo]: {
                      ...config,
                      habilitado: e.target.checked
                    }
                  }
                }))}
              />
              <span>Habilitado</span>
            </label>

            {config.habilitado && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Canales</label>
                  <div className="space-y-2">
                    {['IN_APP', 'EMAIL', 'PUSH', 'SMS'].map(canal => (
                      <label key={canal} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={config.canales?.includes(canal) || false}
                          onChange={(e) => {
                            const newCanales = e.target.checked
                              ? [...(config.canales || []), canal]
                              : (config.canales || []).filter(c => c !== canal);

                            setConfiguracion(prev => ({
                              ...prev,
                              configuracion: {
                                ...prev.configuracion,
                                [tipo]: {
                                  ...config,
                                  canales: newCanales
                                }
                              }
                            }));
                          }}
                        />
                        <span>{canal}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Horario desde</label>
                    <input
                      type="time"
                      value={config.horarioDesde || '08:00'}
                      onChange={(e) => setConfiguracion(prev => ({
                        ...prev,
                        configuracion: {
                          ...prev.configuracion,
                          [tipo]: {
                            ...config,
                            horarioDesde: e.target.value
                          }
                        }
                      }))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Horario hasta</label>
                    <input
                      type="time"
                      value={config.horarioHasta || '22:00'}
                      onChange={(e) => setConfiguracion(prev => ({
                        ...prev,
                        configuracion: {
                          ...prev.configuracion,
                          [tipo]: {
                            ...config,
                            horarioHasta: e.target.value
                          }
                        }
                      }))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={guardando}
        className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : 'Guardar Configuración'}
      </button>
    </div>
  );
}
```

## Funcionalidades Avanzadas

### Solicitar Permisos de Notificaciones del Navegador
```typescript
// utils/notifications.ts
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};
```

### Integración con Service Worker para Push Notifications
```typescript
// public/sw.js
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.mensaje,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.id,
      data: data,
      actions: data.acciones?.slice(0, 2).map(accion => ({
        action: accion.id,
        title: accion.texto
      })) || []
    };

    event.waitUntil(
      self.registration.showNotification(data.titulo, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action) {
    // Manejar acción específica
    const action = event.notification.data.acciones?.find(a => a.id === event.action);
    if (action && action.url) {
      event.waitUntil(clients.openWindow(action.url));
    }
  } else {
    // Abrir la aplicación
    event.waitUntil(clients.openWindow('/notifications'));
  }
});
```

## Variables de Entorno Necesarias

```env
# Next.js (.env.local)
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
```

## Consideraciones de Seguridad

1. **Autenticación**: Siempre incluir token JWT en headers y Socket.IO auth
2. **Validación**: Validar datos en el frontend antes de enviar
3. **Rate Limiting**: Implementar throttling para prevenir spam
4. **Sanitización**: Escapar contenido HTML en notificaciones
5. **Permisos**: Verificar permisos de usuario antes de mostrar acciones

## Tipos TypeScript

```typescript
// types/notifications.ts
export interface Notification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: NotificationType;
  destinatarioId: string;
  remitenteId?: string;
  remitenteNombre?: string;
  remitenteAvatar?: string;
  estado: NotificationStatus;
  prioridad: NotificationPriority;
  canales: NotificationChannel[];
  leida: boolean;
  fechaLectura?: Date;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  programada?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  acciones?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  texto: string;
  tipo: 'PRIMARY' | 'SECONDARY' | 'DANGER';
  url?: string;
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, any>;
}

export enum NotificationType {
  NUEVA_OFERTA = 'NUEVA_OFERTA',
  POSTULACION = 'POSTULACION',
  MENSAJE = 'MENSAJE',
  REACCION = 'REACCION',
  COMENTARIO = 'COMENTARIO',
  SEGUIMIENTO = 'SEGUIMIENTO',
  ACTUALIZACION_PERFIL = 'ACTUALIZACION_PERFIL',
  SISTEMA = 'SISTEMA'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  READ = 'READ',
  FAILED = 'FAILED'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS'
}
```