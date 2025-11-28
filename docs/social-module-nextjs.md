# Módulo Social - Guía de Integración Next.js

## Descripción
Sistema completo de red social con posts, comentarios, reacciones y feed personalizado.

## Características
- Creación y gestión de posts con multimedia
- Sistema de comentarios anidados
- 6 tipos de reacciones (ME_GUSTA, ME_ENCANTA, ME_DIVIERTE, ME_ENTRISTECE, ME_ENOJA, ME_SORPRENDE)
- Feed personalizado basado en conexiones
- Upload de imágenes y videos (Cloudinary)
- Validaciones robustas

## Endpoints REST API

### 1. Crear Post
```typescript
// POST /api/social/posts
const crearPost = async (data: {
  contenido: string;
  esPrivado?: boolean;
}, archivos?: FileList) => {
  const formData = new FormData();
  formData.append('contenido', data.contenido);
  formData.append('esPrivado', data.esPrivado?.toString() || 'false');

  // Agregar archivos si existen
  if (archivos) {
    Array.from(archivos).forEach((file) => {
      if (file.type.startsWith('image/')) {
        formData.append('images', file);
      } else if (file.type.startsWith('video/')) {
        formData.append('videos', file);
      }
    });
  }

  const response = await fetch('/api/social/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};
```

### 2. Obtener Posts (Feed)
```typescript
// GET /api/social/posts
const obtenerPosts = async (filtros: {
  page?: number;
  limit?: number;
  soloConexiones?: boolean;
  autorId?: string;
}) => {
  const searchParams = new URLSearchParams();
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/social/posts?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 3. Obtener Post por ID
```typescript
// GET /api/social/posts/:id
const obtenerPost = async (postId: string) => {
  const response = await fetch(`/api/social/posts/${postId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 4. Crear Comentario
```typescript
// POST /api/social/posts/:id/comentarios
const crearComentario = async (postId: string, data: {
  contenido: string;
  comentarioPadreId?: string; // Para comentarios anidados
}) => {
  const response = await fetch(`/api/social/posts/${postId}/comentarios`, {
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

### 5. Reaccionar a Post
```typescript
// POST /api/social/posts/:id/reacciones
const reaccionarPost = async (postId: string, tipo:
  'ME_GUSTA' | 'ME_ENCANTA' | 'ME_DIVIERTE' | 'ME_ENTRISTECE' | 'ME_ENOJA' | 'ME_SORPRENDE'
) => {
  const response = await fetch(`/api/social/posts/${postId}/reacciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ tipo })
  });
  return response.json();
};
```

### 6. Obtener Feed Personalizado
```typescript
// GET /api/social/feed
const obtenerFeed = async (page = 1, limit = 20) => {
  const response = await fetch(`/api/social/feed?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

## Integración en Next.js

### 1. Hook de Posts/Feed
```typescript
// hooks/useSocialFeed.ts
import { useState, useEffect } from 'react';
import { useApi } from './useApi';

interface Post {
  id: string;
  contenido: string;
  esPrivado: boolean;
  fechaCreacion: string;
  autorId: string;
  autor: {
    nombre: string;
    apellido: string;
    avatar?: string;
  };
  multimedia: Array<{
    id: string;
    url: string;
    tipo: 'IMAGEN' | 'VIDEO';
  }>;
  _count: {
    reacciones: number;
    comentarios: number;
  };
  reaccionUsuario?: {
    tipo: string;
  };
}

export const useSocialFeed = (feedType: 'all' | 'following' | 'user' = 'all', userId?: string) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false
  });
  const { apiCall } = useApi();

  const loadPosts = async (page = 1, append = false) => {
    setLoading(true);
    try {
      let endpoint = '/api/social/posts';
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (feedType === 'following') {
        params.append('soloConexiones', 'true');
      } else if (feedType === 'user' && userId) {
        params.append('autorId', userId);
      } else if (feedType === 'all') {
        endpoint = '/api/social/feed';
      }

      const response = await apiCall(`${endpoint}?${params}`);
      const data = await response.json();

      if (data.success) {
        if (append) {
          setPosts(prev => [...prev, ...data.data.posts]);
        } else {
          setPosts(data.data.posts);
        }
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (contenido: string, archivos?: FileList, esPrivado = false) => {
    try {
      const result = await crearPost({ contenido, esPrivado }, archivos);
      if (result.success) {
        // Agregar el nuevo post al inicio de la lista
        setPosts(prev => [result.data, ...prev]);
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch (error) {
      return { success: false, message: 'Error al crear post' };
    }
  };

  const toggleReaction = async (postId: string, tipo: string) => {
    try {
      const result = await reaccionarPost(postId, tipo as any);
      if (result.success) {
        // Actualizar el post en la lista
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? {
                ...post,
                _count: {
                  ...post._count,
                  reacciones: result.data.totalReacciones
                },
                reaccionUsuario: result.data.reaccionUsuario
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const loadMore = () => {
    if (pagination.hasNext && !loading) {
      loadPosts(pagination.currentPage + 1, true);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [feedType, userId]);

  return {
    posts,
    loading,
    pagination,
    createPost,
    toggleReaction,
    loadMore,
    refresh: () => loadPosts(1, false)
  };
};
```

### 2. Hook de Comentarios
```typescript
// hooks/useComments.ts
import { useState, useEffect } from 'react';
import { useApi } from './useApi';

export const useComments = (postId: string) => {
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const { apiCall } = useApi();

  const loadComments = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`/api/social/posts/${postId}/comentarios`);
      const data = await response.json();

      if (data.success) {
        setComentarios(data.data.comentarios);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (contenido: string, comentarioPadreId?: string) => {
    try {
      const result = await crearComentario(postId, { contenido, comentarioPadreId });
      if (result.success) {
        // Recargar comentarios (simplificado)
        await loadComments();
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch (error) {
      return { success: false, message: 'Error al agregar comentario' };
    }
  };

  useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  return {
    comentarios,
    loading,
    addComment,
    refresh: loadComments
  };
};
```

### 3. Componente de Post
```typescript
// components/PostCard.tsx
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useComments } from '@/hooks/useComments';

interface PostCardProps {
  post: {
    id: string;
    contenido: string;
    fechaCreacion: string;
    autor: {
      id: string;
      nombre: string;
      apellido: string;
      avatar?: string;
    };
    multimedia: Array<{
      id: string;
      url: string;
      tipo: 'IMAGEN' | 'VIDEO';
    }>;
    _count: {
      reacciones: number;
      comentarios: number;
    };
    reaccionUsuario?: {
      tipo: string;
    };
  };
  onReaction: (postId: string, tipo: string) => void;
}

const REACTION_EMOJIS = {
  ME_GUSTA: '👍',
  ME_ENCANTA: '❤️',
  ME_DIVIERTE: '😂',
  ME_ENTRISTECE: '😢',
  ME_ENOJA: '😠',
  ME_SORPRENDE: '😮'
};

export default function PostCard({ post, onReaction }: PostCardProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [newComment, setNewComment] = useState('');
  const { comentarios, loading: loadingComments, addComment } = useComments(
    showComments ? post.id : ''
  );

  const handleReaction = (tipo: string) => {
    onReaction(post.id, tipo);
    setShowReactions(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const result = await addComment(newComment);
    if (result.success) {
      setNewComment('');
    } else {
      alert(result.message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} horas`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="post-card bg-white rounded-lg shadow mb-6">
      {/* Header del post */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <img
            src={post.autor.avatar || '/default-avatar.jpg'}
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h4 className="font-semibold">
              {post.autor.nombre} {post.autor.apellido}
            </h4>
            <p className="text-gray-500 text-sm">{formatDate(post.fechaCreacion)}</p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        <p className="text-gray-800 mb-4">{post.contenido}</p>

        {/* Multimedia */}
        {post.multimedia.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {post.multimedia.map((media) => (
              <div key={media.id} className="relative">
                {media.tipo === 'IMAGEN' ? (
                  <img
                    src={media.url}
                    alt="Post media"
                    className="w-full h-64 object-cover rounded"
                  />
                ) : (
                  <video
                    src={media.url}
                    controls
                    className="w-full h-64 rounded"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            {post._count.reacciones} reacciones
          </span>
          <span className="text-sm text-gray-500">
            {post._count.comentarios} comentarios
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Botón de reacción */}
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className={`flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-100 ${
                post.reaccionUsuario ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <span>
                {post.reaccionUsuario
                  ? REACTION_EMOJIS[post.reaccionUsuario.tipo]
                  : '👍'
                }
              </span>
              <span className="text-sm">
                {post.reaccionUsuario ? 'Te gusta' : 'Me gusta'}
              </span>
            </button>

            {/* Panel de reacciones */}
            {showReactions && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-2 flex space-x-2 z-10">
                {Object.entries(REACTION_EMOJIS).map(([tipo, emoji]) => (
                  <button
                    key={tipo}
                    onClick={() => handleReaction(tipo)}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón de comentarios */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-100 text-gray-600"
          >
            <span>💬</span>
            <span className="text-sm">Comentar</span>
          </button>
        </div>
      </div>

      {/* Sección de comentarios */}
      {showComments && (
        <div className="border-t bg-gray-50">
          {/* Formulario para nuevo comentario */}
          <form onSubmit={handleAddComment} className="p-4 border-b">
            <div className="flex space-x-3">
              <img
                src={user?.avatar || '/default-avatar.jpg'}
                alt="Tu avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="w-full p-2 border rounded resize-none"
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                  Comentar
                </button>
              </div>
            </div>
          </form>

          {/* Lista de comentarios */}
          <div className="p-4">
            {loadingComments ? (
              <div>Cargando comentarios...</div>
            ) : (
              comentarios.map((comentario: any) => (
                <CommentItem key={comentario.id} comentario={comentario} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4. Componente de Creación de Posts
```typescript
// components/CreatePost.tsx
import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface CreatePostProps {
  onPostCreated: (post: any) => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [contenido, setContenido] = useState('');
  const [archivos, setArchivos] = useState<FileList | null>(null);
  const [esPrivado, setEsPrivado] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenido.trim() && !archivos) return;

    setLoading(true);
    try {
      const result = await crearPost({ contenido, esPrivado }, archivos || undefined);

      if (result.success) {
        setContenido('');
        setArchivos(null);
        setEsPrivado(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onPostCreated(result.data);
      } else {
        alert(result.message || 'Error al crear post');
      }
    } catch (error) {
      alert('Error al crear post');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArchivos(e.target.files);
  };

  const removeFile = (index: number) => {
    if (!archivos) return;

    const newFiles = Array.from(archivos);
    newFiles.splice(index, 1);

    // Crear nuevo FileList
    const dt = new DataTransfer();
    newFiles.forEach(file => dt.items.add(file));
    setArchivos(dt.files);

    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
    }
  };

  return (
    <div className="create-post bg-white rounded-lg shadow p-6 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex space-x-4">
          <img
            src={user?.avatar || '/default-avatar.jpg'}
            alt="Tu avatar"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="¿Qué quieres compartir?"
              className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />

            {/* Preview de archivos */}
            {archivos && archivos.length > 0 && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                {Array.from(archivos).map((file, index) => (
                  <div key={index} className="relative">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-24 object-cover rounded"
                      />
                    ) : (
                      <video
                        src={URL.createObjectURL(file)}
                        className="w-full h-24 object-cover rounded"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Opciones y acciones */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer text-gray-600 hover:text-blue-600">
                  <span>📷</span>
                  <span className="text-sm">Multimedia</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esPrivado}
                    onChange={(e) => setEsPrivado(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600">Privado</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={(!contenido.trim() && !archivos) || loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600"
              >
                {loading ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
```

### 5. Página de Feed Social
```typescript
// pages/social.tsx or components/SocialFeed.tsx
import { useState } from 'react';
import { useSocialFeed } from '@/hooks/useSocialFeed';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';

export default function SocialFeed() {
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');
  const { posts, loading, pagination, createPost, toggleReaction, loadMore } = useSocialFeed(feedType);

  const handlePostCreated = (newPost: any) => {
    // El hook ya maneja esto internamente
  };

  return (
    <div className="social-feed max-w-4xl mx-auto p-6">
      {/* Selector de feed */}
      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setFeedType('all')}
            className={`pb-2 px-4 ${
              feedType === 'all'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Para ti
          </button>
          <button
            onClick={() => setFeedType('following')}
            className={`pb-2 px-4 ${
              feedType === 'following'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Siguiendo
          </button>
        </div>
      </div>

      {/* Crear post */}
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Lista de posts */}
      <div className="posts-list">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onReaction={toggleReaction}
          />
        ))}

        {/* Botón de cargar más */}
        {pagination.hasNext && (
          <div className="text-center mt-6">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Cargar más posts'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Tipos TypeScript

```typescript
// types/social.ts
export interface Post {
  id: string;
  contenido: string;
  esPrivado: boolean;
  fechaCreacion: string;
  autorId: string;
  autor: {
    id: string;
    nombre: string;
    apellido: string;
    avatar?: string;
  };
  multimedia: MediaItem[];
  _count: {
    reacciones: number;
    comentarios: number;
  };
  reaccionUsuario?: {
    tipo: TipoReaccion;
  };
}

export interface MediaItem {
  id: string;
  url: string;
  tipo: 'IMAGEN' | 'VIDEO';
  publicId: string;
}

export interface Comentario {
  id: string;
  contenido: string;
  fechaCreacion: string;
  autorId: string;
  postId: string;
  comentarioPadreId?: string;
  autor: {
    nombre: string;
    apellido: string;
    avatar?: string;
  };
  respuestas?: Comentario[];
}

export type TipoReaccion =
  | 'ME_GUSTA'
  | 'ME_ENCANTA'
  | 'ME_DIVIERTE'
  | 'ME_ENTRISTECE'
  | 'ME_ENOJA'
  | 'ME_SORPRENDE';
```

## Variables de Entorno

```env
# Next.js (.env.local)
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## Consideraciones

1. **Upload de archivos**: Manejar correctamente imágenes y videos
2. **Optimización**: Implementar lazy loading para el feed
3. **Cache**: Cache inteligente para posts frecuentemente visitados
4. **Privacidad**: Respetar configuraciones de privacidad
5. **Performance**: Optimizar carga de multimedia
6. **Real-time**: Considerar WebSockets para actualizaciones en tiempo real