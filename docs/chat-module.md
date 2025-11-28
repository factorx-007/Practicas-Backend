# Módulo de Chat - Guía de Integración Next.js

## Descripción
Sistema completo de chat en tiempo real con Socket.IO, MongoDB y REST API.

## Arquitectura
- **Base de datos**: MongoDB (chat) + PostgreSQL (usuarios)
- **Tiempo real**: Socket.IO
- **REST API**: Express.js con validaciones
- **Archivos**: Cloudinary integration

## Endpoints REST API

### 1. Crear Conversación
```typescript
// POST /api/chat/conversaciones
const crearConversacion = async (data: {
  tipo: 'PRIVADA' | 'GRUPO';
  nombre?: string;
  participantes: string[];
}) => {
  const response = await fetch('/api/chat/conversaciones', {
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

### 2. Obtener Conversaciones
```typescript
// GET /api/chat/conversaciones
const obtenerConversaciones = async (page = 1, limit = 20) => {
  const response = await fetch(`/api/chat/conversaciones?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 3. Enviar Mensaje
```typescript
// POST /api/chat/mensajes
const enviarMensaje = async (data: {
  conversacionId: string;
  contenido: string;
  tipo?: 'TEXTO' | 'IMAGEN' | 'ARCHIVO';
}, archivos?: FileList) => {
  const formData = new FormData();
  formData.append('conversacionId', data.conversacionId);
  formData.append('contenido', data.contenido);

  // Archivos opcionales
  if (archivos) {
    Array.from(archivos).forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        formData.append('images', file);
      } else if (file.type.startsWith('video/')) {
        formData.append('videos', file);
      } else {
        formData.append('files', file);
      }
    });
  }

  const response = await fetch('/api/chat/mensajes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};
```

### 4. Obtener Mensajes
```typescript
// GET /api/chat/conversaciones/:id/mensajes
const obtenerMensajes = async (conversacionId: string, page = 1) => {
  const response = await fetch(
    `/api/chat/conversaciones/${conversacionId}/mensajes?page=${page}&limit=50`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
};
```

## Integración Socket.IO en Next.js

### 1. Configuración del Cliente
```typescript
// lib/socket.ts
import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
      auth: { token },
      transports: ['websocket']
    });

    this.setupEventListeners();
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Conectado al chat');
    });

    this.socket.on('error', (error) => {
      console.error('Error de socket:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketManager = new SocketManager();
```

### 2. Hook de Chat
```typescript
// hooks/useChat.ts
import { useEffect, useState } from 'react';
import { socketManager } from '@/lib/socket';

interface Mensaje {
  _id: string;
  conversacionId: string;
  autorId: string;
  autorNombre: string;
  contenido: string;
  fechaCreacion: Date;
  archivosAdjuntos?: any[];
}

export const useChat = (conversacionId: string, token: string) => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [usuariosEnLinea, setUsuariosEnLinea] = useState<string[]>([]);
  const [usuariosEscribiendo, setUsuariosEscribiendo] = useState<string[]>([]);

  useEffect(() => {
    const socket = socketManager.connect(token);

    // Unirse a la conversación
    socket.emit('unirse_conversacion', { conversacionId });

    // Escuchar mensajes nuevos
    socket.on('nuevo_mensaje', (mensaje: Mensaje) => {
      if (mensaje.conversacionId === conversacionId) {
        setMensajes(prev => [...prev, mensaje]);
      }
    });

    // Escuchar usuarios en línea
    socket.on('usuarios_en_linea', (usuarios: string[]) => {
      setUsuariosEnLinea(usuarios);
    });

    // Escuchar usuarios escribiendo
    socket.on('usuario_escribiendo', ({ userId, escribiendo }) => {
      setUsuariosEscribiendo(prev =>
        escribiendo
          ? [...prev.filter(id => id !== userId), userId]
          : prev.filter(id => id !== userId)
      );
    });

    return () => {
      socket.emit('salir_conversacion', { conversacionId });
      socketManager.disconnect();
    };
  }, [conversacionId, token]);

  const enviarMensaje = (contenido: string) => {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit('enviar_mensaje', {
        conversacionId,
        contenido,
        tipo: 'TEXTO'
      });
    }
  };

  const indicarEscribiendo = (escribiendo: boolean) => {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit('escribiendo', { conversacionId, escribiendo });
    }
  };

  return {
    mensajes,
    usuariosEnLinea,
    usuariosEscribiendo,
    enviarMensaje,
    indicarEscribiendo
  };
};
```

### 3. Componente de Chat
```typescript
// components/Chat.tsx
import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';

interface ChatProps {
  conversacionId: string;
  token: string;
}

export default function Chat({ conversacionId, token }: ChatProps) {
  const [mensaje, setMensaje] = useState('');
  const [archivos, setArchivos] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    mensajes,
    usuariosEnLinea,
    usuariosEscribiendo,
    enviarMensaje,
    indicarEscribiendo
  } = useChat(conversacionId, token);

  const handleEnviar = async () => {
    if (!mensaje.trim() && !archivos) return;

    if (archivos && archivos.length > 0) {
      // Enviar con archivos via REST API
      await enviarMensajeConArchivos({
        conversacionId,
        contenido: mensaje
      }, archivos);
      setArchivos(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      // Enviar via Socket.IO
      enviarMensaje(mensaje);
    }

    setMensaje('');
  };

  useEffect(() => {
    // Indicar que está escribiendo
    if (mensaje.length > 0) {
      indicarEscribiendo(true);
      const timeout = setTimeout(() => indicarEscribiendo(false), 3000);
      return () => clearTimeout(timeout);
    } else {
      indicarEscribiendo(false);
    }
  }, [mensaje]);

  return (
    <div className="chat-container">
      {/* Lista de mensajes */}
      <div className="mensajes">
        {mensajes.map(msg => (
          <div key={msg._id} className="mensaje">
            <strong>{msg.autorNombre}:</strong> {msg.contenido}
            {msg.archivosAdjuntos?.map((archivo, idx) => (
              <div key={idx}>
                <a href={archivo.url} target="_blank">
                  {archivo.original_name}
                </a>
              </div>
            ))}
          </div>
        ))}

        {/* Indicador de usuarios escribiendo */}
        {usuariosEscribiendo.length > 0 && (
          <div className="escribiendo">
            {usuariosEscribiendo.length} usuario(s) escribiendo...
          </div>
        )}
      </div>

      {/* Input de mensaje */}
      <div className="input-container">
        <input
          type="text"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleEnviar()}
          placeholder="Escribe un mensaje..."
        />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => setArchivos(e.target.files)}
          style={{ display: 'none' }}
        />

        <button onClick={() => fileInputRef.current?.click()}>
          📎
        </button>

        <button onClick={handleEnviar}>
          Enviar
        </button>
      </div>

      {/* Usuarios en línea */}
      <div className="usuarios-online">
        <h4>En línea ({usuariosEnLinea.length})</h4>
        {usuariosEnLinea.map(userId => (
          <div key={userId}>🟢 {userId}</div>
        ))}
      </div>
    </div>
  );
}
```

## Funcionalidades Avanzadas

### Reacciones a Mensajes
```typescript
const agregarReaccion = async (mensajeId: string, emoji: string) => {
  const response = await fetch(`/api/chat/mensajes/${mensajeId}/reacciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ emoji })
  });
  return response.json();
};
```

### Marcar como Leído
```typescript
const marcarComoLeido = async (conversacionId: string, mensajeId: string) => {
  const response = await fetch('/api/chat/leido', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ conversacionId, mensajeId })
  });
  return response.json();
};
```

### Estadísticas del Chat
```typescript
const obtenerEstadisticas = async () => {
  const response = await fetch('/api/chat/estadisticas', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

## Variables de Entorno Necesarias

```env
# Next.js (.env.local)
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

## Consideraciones de Seguridad

1. **Autenticación**: Siempre incluir token JWT en headers
2. **Validación**: Validar archivos en el frontend antes de enviar
3. **Rate Limiting**: Implementar throttling en envío de mensajes
4. **Sanitización**: Escapar contenido HTML en mensajes

## Tipos TypeScript

```typescript
// types/chat.ts
export interface Conversacion {
  _id: string;
  tipo: 'PRIVADA' | 'GRUPO';
  nombre?: string;
  participantes: string[];
  fechaCreacion: Date;
  ultimoMensaje?: {
    contenido: string;
    fechaCreacion: Date;
  };
}

export interface Mensaje {
  _id: string;
  conversacionId: string;
  autorId: string;
  autorNombre: string;
  contenido: string;
  tipo: 'TEXTO' | 'IMAGEN' | 'ARCHIVO';
  archivosAdjuntos?: ArchivoAdjunto[];
  reacciones?: Reaccion[];
  editado: boolean;
  fechaCreacion: Date;
}

export interface ArchivoAdjunto {
  url: string;
  public_id: string;
  original_name: string;
  size: number;
  format: string;
}
```