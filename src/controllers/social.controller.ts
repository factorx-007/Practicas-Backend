import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponseHandler } from '../utils/responses';
import logger from '../utils/logger';
import { prisma } from '../config/database';
import { getNotificationsSocketInstance } from '../socket/notifications.socket';
import {
  PostQueryParams,
  ComentarioQueryParams,
  CreatePostDTO,
  UpdatePostDTO,
  CreateComentarioDTO,
  UpdateComentarioDTO,
  CreateReaccionDTO,
  TipoReaccion
} from '../types/social.types';
import { NotificationsService } from '../services/notifications.service';
import { NotificationType } from '../types/common.types';

const notificationsService = new NotificationsService();

class SocialController {
  // ==================== POSTS ====================

  /**
   * Crear un nuevo post
   */
  async createPost(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.error(res, 'Datos inválidos', 400);
      }

      const userId = req.user!.id;
      const createData: CreatePostDTO = req.body;

      logger.debug('Request body:', req.body);
      logger.debug('Uploaded files:', req.uploadedFiles);

      // Convertir 'privado' de string a boolean (cuando viene de FormData)
      // FormData envía todos los valores como strings
      const privadoValue = req.body.privado;
      const privadoBoolean = privadoValue === true ||
                            privadoValue === 'true' ||
                            privadoValue === '1';

      // Agregar archivos subidos si existen
      if (req.uploadedFiles?.images || req.uploadedFiles?.videos) {
        const imagenes: string[] = [];
        const videos: string[] = [];

        if (req.uploadedFiles.images) {
          imagenes.push(...req.uploadedFiles.images.map((img: any) => img.secure_url));
        }

        if (req.uploadedFiles.videos) {
          videos.push(...req.uploadedFiles.videos.map((vid: any) => vid.secure_url));
        }

        createData.imagenes = imagenes;
        createData.videos = videos;
      }

      logger.debug('Data for post creation:', createData);

      const newPost = await prisma.post.create({
        data: {
          contenido: createData.contenido,
          privado: privadoBoolean,
          imagenes: createData.imagenes || [],
          videos: createData.videos || [],
          autorId: userId
        },
        include: {
          autor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              avatar: true,
              rol: true
            }
          },
          _count: {
            select: {
              comentarios: true,
              reacciones: true
            }
          }
        }
      });

      // Transformar respuesta para incluir totalComentarios y totalReacciones
      const postResponse = {
        ...newPost,
        totalComentarios: (newPost as any)._count.comentarios,
        totalReacciones: (newPost as any)._count.reacciones,
        _count: undefined // Eliminar _count del response
      };

      logger.info(`Post creado: ${newPost.id} por usuario ${userId}`);
      return ApiResponseHandler.success(res, postResponse, 'Post creado exitosamente');

    } catch (error) {
      logger.error('Error al crear post:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  /**
   * Obtener posts con paginación y filtros
   */
  async getPosts(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        autorId,
        fechaDesde,
        fechaHasta,
        busqueda,
        soloConexiones,
        orderBy = 'createdAt',
        order = 'desc'
      } = req.query as unknown as PostQueryParams;

      // Convertir page y limit a números (vienen como strings desde query params)
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;
      const userId = req.user?.id;

      // Construir filtros
      const where: any = {};

      if (autorId) where.autorId = autorId;
      if (fechaDesde || fechaHasta) {
        where.createdAt = {};
        if (fechaDesde) where.createdAt.gte = new Date(fechaDesde);
        if (fechaHasta) where.createdAt.lte = new Date(fechaHasta);
      }
      if (busqueda) {
        where.contenido = {
          contains: busqueda,
          mode: 'insensitive'
        };
      }

      // Filtro de conexiones
      if (soloConexiones && userId) {
        const conexiones = await prisma.follow.findMany({
          where: {
            OR: [
              { seguidorId: userId },
              { seguidoId: userId }
            ]
          }
        });

        const conexionesIds = conexiones.map(c =>
          c.seguidorId === userId ? c.seguidoId : c.seguidorId
        );
        conexionesIds.push(userId);
        where.autorId = { in: conexionesIds };
      }

      // Obtener posts
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: {
            autor: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                avatar: true,
                rol: true,
                empresa: {
                  select: {
                    nombre_empresa: true
                  }
                }
              }
            },
            reacciones: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    avatar: true
                  }
                }
              }
            },
            _count: {
              select: {
                comentarios: true,
                reacciones: true
              }
            }
          },
          skip: offset,
          take: limitNum,
          orderBy: { [orderBy]: order }
        }),
        prisma.post.count({ where })
      ]);

      // Transformar posts para incluir totalComentarios, totalReacciones, yaReaccionado y tipoReaccionUsuario
      const postsWithTotals = posts.map((post: any) => {
        // Verificar si el usuario actual ha reaccionado a este post
        let yaReaccionado = false;
        let tipoReaccionUsuario = undefined;

        if (userId) {
          const reaccionUsuario = post.reacciones.find((r: any) => r.usuarioId === userId);
          if (reaccionUsuario) {
            yaReaccionado = true;
            tipoReaccionUsuario = reaccionUsuario.tipo;
          }
        }

        return {
          ...post,
          totalComentarios: post._count.comentarios,
          totalReacciones: post._count.reacciones,
          yaReaccionado,
          tipoReaccionUsuario,
          _count: undefined,
          reacciones: undefined // No enviar todas las reacciones en la lista para optimizar
        };
      });

      const totalPages = Math.ceil(total / limitNum);

      return ApiResponseHandler.success(res, {
        posts: postsWithTotals,
        pagination: {
          total,
          page: pageNum,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }, 'Posts obtenidos exitosamente');

    } catch (error) {
      logger.error('Error al obtener posts:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  /**
   * Obtener un post específico por ID
   */
  async getPostById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          autor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              avatar: true,
              rol: true,
              empresa: {
                select: {
                  nombre_empresa: true
                }
              }
            }
          },
          comentarios: {
            orderBy: { createdAt: 'asc' },
            include: {
              autor: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  avatar: true,
                  rol: true
                }
              },
              reacciones: {
                include: {
                  usuario: {
                    select: {
                      id: true,
                      nombre: true,
                      apellido: true,
                      avatar: true
                    }
                  }
                }
              }
            }
          },
          reacciones: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  avatar: true
                }
              }
            }
          },
          _count: {
            select: {
              comentarios: true,
              reacciones: true
            }
          }
        }
      });

      if (!post) {
        return ApiResponseHandler.error(res, 'Post no encontrado', 404);
      }

      // Verificar permisos de visualización
      if (post.privado && post.autorId !== userId) {
        return ApiResponseHandler.error(res, 'No tienes permisos para ver este post', 403);
      }

      // Verificar si el usuario actual ha reaccionado a este post
      let yaReaccionado = false;
      let tipoReaccionUsuario = undefined;

      if (userId) {
        const reaccionUsuario = post.reacciones.find(r => r.usuarioId === userId);
        if (reaccionUsuario) {
          yaReaccionado = true;
          tipoReaccionUsuario = reaccionUsuario.tipo;
        }
      }

      // Transformar respuesta para incluir totalComentarios, totalReacciones, yaReaccionado y tipoReaccionUsuario
      const postResponse = {
        ...post,
        totalComentarios: (post as any)._count.comentarios,
        totalReacciones: (post as any)._count.reacciones,
        yaReaccionado,
        tipoReaccionUsuario,
        _count: undefined
      };

      return ApiResponseHandler.success(res, postResponse, 'Post obtenido exitosamente');

    } catch (error) {
      logger.error('Error al obtener post:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  /**
   * Actualizar un post
   */
  async updatePost(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.error(res, 'Datos inválidos', 400);
      }

      const { id } = req.params;
      const userId = req.user!.id;
      const updateData: UpdatePostDTO = req.body;

      // Verificar que el post existe y pertenece al usuario
      const post = await prisma.post.findFirst({
        where: { id, autorId: userId }
      });

      if (!post) {
        return ApiResponseHandler.error(res, 'Post no encontrado o no autorizado', 404);
      }

      const updatedPost = await prisma.post.update({
        where: { id },
        data: updateData,
        include: {
          autor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              avatar: true,
              rol: true
            }
          }
        }
      });

      logger.info(`Post actualizado: ${id} por usuario ${userId}`);
      return ApiResponseHandler.success(res, updatedPost, 'Post actualizado exitosamente');

    } catch (error) {
      logger.error('Error al actualizar post:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  /**
   * Eliminar un post
   */
  async deletePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Verificar que el post existe y pertenece al usuario
      const post = await prisma.post.findFirst({
        where: { id, autorId: userId }
      });

      if (!post) {
        return ApiResponseHandler.error(res, 'Post no encontrado o no autorizado', 404);
      }

      await prisma.post.delete({
        where: { id }
      });

      logger.info(`Post eliminado: ${id} por usuario ${userId}`);
      return ApiResponseHandler.success(res, null, 'Post eliminado exitosamente');

    } catch (error) {
      logger.error('Error al eliminar post:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // ==================== COMENTARIOS ====================

  /**
   * Crear un comentario en un post
   */
  async createComentario(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.error(res, 'Datos inválidos', 400);
      }

      const userId = req.user!.id;
      const createData: CreateComentarioDTO = req.body;

      // Verificar que el post existe
      const post = await prisma.post.findUnique({
        where: { id: createData.postId }
      });

      if (!post) {
        return ApiResponseHandler.error(res, 'Post no encontrado', 404);
      }

      // Verificar permisos para comentar
      if (post.privado && post.autorId !== userId) {
        return ApiResponseHandler.error(res, 'No puedes comentar en este post', 403);
      }

      const nuevoComentario = await prisma.comentario.create({
        data: {
          contenido: createData.contenido,
          postId: createData.postId,
          autorId: userId,
          parentId: createData.parentId
        },
        include: {
          autor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              avatar: true,
              rol: true
            }
          }
        }
      });

      // Crear notificación para el autor del post
      if (post.autorId !== userId) {
        const remitente = await prisma.usuario.findUnique({ where: { id: userId } });
        if (remitente) {
          const notificationsSocket = getNotificationsSocketInstance();
          if (notificationsSocket) {
            await notificationsSocket.createAndSendNotification({
              titulo: 'Nuevo comentario',
              mensaje: `${remitente.nombre} ${remitente.apellido} ha comentado en tu publicación`,
              tipo: NotificationType.COMENTARIO,
              destinatarioId: post.autorId,
              remitenteId: userId,
              metadata: {
                postId: post.id,
                comentarioId: nuevoComentario.id
              }
            });
          }
        }
      }

      logger.info(`Comentario creado: ${nuevoComentario.id} en post ${createData.postId}`);
      return ApiResponseHandler.success(res, nuevoComentario, 'Comentario creado exitosamente');

    } catch (error) {
      logger.error('Error al crear comentario:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  /**
   * Obtener comentarios de un post
   */
  async getComentarios(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        postId,
        incluirRespuestas = true,
        orderBy = 'createdAt',
        order = 'asc'
      } = req.query as unknown as ComentarioQueryParams;

      // Convertir page y limit a números
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      const [comentarios, total] = await Promise.all([
        prisma.comentario.findMany({
          where: {
            postId,
            parentId: null
          },
          include: {
            autor: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                avatar: true,
                rol: true
              }
            },
            respuestas: incluirRespuestas ? {
              include: {
                autor: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    avatar: true,
                    rol: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            } : false
          },
          skip: offset,
          take: limitNum,
          orderBy: { [orderBy]: order }
        }),
        prisma.comentario.count({
          where: {
            postId,
            parentId: null
          }
        })
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return ApiResponseHandler.success(res, {
        comentarios,
        pagination: {
          total,
          page: pageNum,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }, 'Comentarios obtenidos exitosamente');

    } catch (error) {
      logger.error('Error al obtener comentarios:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  /**
   * Actualizar un comentario
   */
  async updateComentario(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.error(res, 'Datos inválidos', 400);
      }

      const { id } = req.params;
      const userId = req.user!.id;
      const updateData: UpdateComentarioDTO = req.body;

      // Verificar que el comentario existe y pertenece al usuario
      const comentario = await prisma.comentario.findFirst({
        where: { id, autorId: userId }
      });

      if (!comentario) {
        return ApiResponseHandler.error(res, 'Comentario no encontrado o no autorizado', 404);
      }

      const updatedComentario = await prisma.comentario.update({
        where: { id },
        data: {
          contenido: updateData.contenido
        },
        include: {
          autor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              avatar: true,
              rol: true
            }
          }
        }
      });

      logger.info(`Comentario actualizado: ${id} por usuario ${userId}`);
      return ApiResponseHandler.success(res, updatedComentario, 'Comentario actualizado exitosamente');

    } catch (error) {
      logger.error('Error al actualizar comentario:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  /**
   * Eliminar un comentario
   */
  async deleteComentario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Verificar que el comentario existe y pertenece al usuario
      const comentario = await prisma.comentario.findFirst({
        where: { id, autorId: userId }
      });

      if (!comentario) {
        return ApiResponseHandler.error(res, 'Comentario no encontrado o no autorizado', 404);
      }

      await prisma.comentario.delete({
        where: { id }
      });

      logger.info(`Comentario eliminado: ${id} por usuario ${userId}`);
      return ApiResponseHandler.success(res, null, 'Comentario eliminado exitosamente');

    } catch (error) {
      logger.error('Error al eliminar comentario:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // ==================== REACCIONES ====================

  /**
   * Crear o actualizar reacción a un post o comentario
   */
  async toggleReaccion(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponseHandler.validationError(res, errors.array(), 'Datos inválidos');
      }

      const userId = req.user!.id;
      const createData: CreateReaccionDTO = req.body;

      // Verificar que se proporcionó un postId o comentarioId
      if (!createData.postId && !createData.comentarioId) {
        return ApiResponseHandler.error(res, 'ID del post o comentario es requerido', 400);
      }

      let post: any = null;
      if (createData.postId) {
        post = await prisma.post.findUnique({
          where: { id: createData.postId }
        });

        if (!post) {
          return ApiResponseHandler.error(res, 'Post no encontrado', 404);
        }
      }

      let comentario: any = null;
      if (createData.comentarioId) {
        comentario = await prisma.comentario.findUnique({
          where: { id: createData.comentarioId }
        });

        if (!comentario) {
          return ApiResponseHandler.error(res, 'Comentario no encontrado', 404);
        }
      }

      // Buscar reacción existente
      const reaccionExistente = await prisma.reaccion.findFirst({
        where: {
          usuarioId: userId,
          postId: createData.postId,
          comentarioId: createData.comentarioId
        }
      });

      if (reaccionExistente) {
        if (reaccionExistente.tipo === createData.tipo) {
          // Eliminar reacción si es del mismo tipo
          await prisma.reaccion.delete({
            where: { id: reaccionExistente.id }
          });
          logger.info(`Reacción eliminada en ${createData.postId ? 'post ' + createData.postId : 'comentario ' + createData.comentarioId} por usuario ${userId}`);
          return ApiResponseHandler.success(res, {
            accion: 'eliminada',
            reaccion: null
          }, 'Reacción eliminada exitosamente');
        } else {
          // Actualizar tipo de reacción
          const reaccionActualizada = await prisma.reaccion.update({
            where: { id: reaccionExistente.id },
            data: { tipo: createData.tipo },
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  avatar: true
                }
              }
            }
          });

          // Notificar al autor
          const autorId = post?.autorId || comentario?.autorId;
          if (autorId && autorId !== userId) {
            const remitente = await prisma.usuario.findUnique({ where: { id: userId } });
            if (remitente) {
              const notificationsSocket = getNotificationsSocketInstance();
              if (notificationsSocket) {
                await notificationsSocket.createAndSendNotification({
                  titulo: 'Nueva reacción',
                  mensaje: `${remitente.nombre} ${remitente.apellido} ha reaccionado a tu ${post ? 'publicación' : 'comentario'}`,
                  tipo: NotificationType.REACCION,
                  destinatarioId: autorId,
                  remitenteId: userId,
                  metadata: {
                    postId: post?.id,
                    comentarioId: comentario?.id
                  }
                });
              }
            }
          }

          logger.info(`Reacción actualizada en ${createData.postId ? 'post ' + createData.postId : 'comentario ' + createData.comentarioId} por usuario ${userId}`);
          return ApiResponseHandler.success(res, {
            accion: 'actualizada',
            reaccion: reaccionActualizada
          }, 'Reacción actualizada exitosamente');
        }
      } else {
        // Crear nueva reacción
        const nuevaReaccion = await prisma.reaccion.create({
          data: {
            tipo: createData.tipo,
            usuarioId: userId,
            postId: createData.postId,
            comentarioId: createData.comentarioId
          },
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                avatar: true
              }
            }
          }
        });

        // Notificar al autor
        const autorId = post?.autorId || comentario?.autorId;
        if (autorId && autorId !== userId) {
          const remitente = await prisma.usuario.findUnique({ where: { id: userId } });
          if (remitente) {
            const notificationsSocket = getNotificationsSocketInstance();
            if (notificationsSocket) {
              await notificationsSocket.createAndSendNotification({
                titulo: 'Nueva reacción',
                mensaje: `${remitente.nombre} ${remitente.apellido} ha reaccionado a tu ${post ? 'publicación' : 'comentario'}`,
                tipo: NotificationType.REACCION,
                destinatarioId: autorId,
                remitenteId: userId,
                metadata: {
                  postId: post?.id,
                  comentarioId: comentario?.id
                }
              });
            }
          }
        }

        logger.info(`Reacción creada en ${createData.postId ? 'post ' + createData.postId : 'comentario ' + createData.comentarioId} por usuario ${userId}`);
        return ApiResponseHandler.success(res, {
          accion: 'creada',
          reaccion: nuevaReaccion
        }, 'Reacción creada exitosamente');
      }

    } catch (error) {
      logger.error('Error al procesar reacción:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  /**
   * Obtener feed personalizado del usuario
   */
  async getFeed(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const {
        page = 1,
        limit = 10,
        orderBy = 'createdAt',
        order = 'desc'
      } = req.query as unknown as PostQueryParams;

      // Convertir page y limit a números
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      // Obtener IDs de usuarios seguidos
      const follows = await prisma.follow.findMany({
        where: {
          seguidorId: userId
        }
      });

      const followIds = follows.map(f => f.seguidoId);
      followIds.push(userId); // Incluir posts propios

      // Obtener posts del feed
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: {
            autorId: { in: followIds },
            privado: false // Solo posts públicos para el feed
          },
          include: {
            autor: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                avatar: true,
                rol: true
              }
            },
            _count: {
              select: {
                comentarios: true,
                reacciones: true
              }
            }
          },
          skip: offset,
          take: limitNum,
          orderBy: { [orderBy]: order }
        }),
        prisma.post.count({
          where: {
            autorId: { in: followIds },
            privado: false
          }
        })
      ]);

      // Transformar posts para incluir totalComentarios y totalReacciones
      const postsWithTotals = posts.map((post: any) => ({
        ...post,
        totalComentarios: post._count.comentarios,
        totalReacciones: post._count.reacciones,
        _count: undefined
      }));

      const totalPages = Math.ceil(total / limitNum);

      return ApiResponseHandler.success(res, {
        posts: postsWithTotals,
        pagination: {
          total,
          page: pageNum,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }, 'Feed obtenido exitosamente');

    } catch (error) {
      logger.error('Error al obtener feed:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }
}

export default new SocialController();