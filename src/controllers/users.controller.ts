import { Request, Response } from 'express';
import { ApiResponseHandler } from '../utils/responses';
import usersService from '../services/users.service';
import logger from '../utils/logger';
import { UserRole } from '../types/common.types';
import { uploadConfigs } from '../config/upload';
import { streamUpload } from '../config/cloudinary';

export class UsersController {
  // Obtener perfil del usuario actual
  async getMyProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      let profile;

      switch (req.user.rol) {
        case UserRole.ESTUDIANTE:
          profile = await usersService.getStudentProfile(req.user.id);
          break;
        case UserRole.EMPRESA:
          profile = await usersService.getCompanyProfile(req.user.id);
          break;
        case UserRole.INSTITUCION:
          profile = await usersService.getInstitutionProfile(req.user.id);
          break;
        case UserRole.ADMIN:
          profile = await usersService.getUserById(req.user.id);
          break;
        default:
          profile = await usersService.getUserById(req.user.id);
      }

      if (!profile) {
        return ApiResponseHandler.notFound(res, 'Perfil no encontrado');
      }

      return ApiResponseHandler.success(res, profile, 'Perfil obtenido exitosamente');
    } catch (error: any) {
      logger.error('Error obteniendo perfil propio:', error, {
        userId: req.user?.id
      });
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Obtener perfil de usuario por ID
  async getUserProfile(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      // Primero obtener información básica del usuario
      const user = await usersService.getUserById(userId);
      if (!user) {
        return ApiResponseHandler.notFound(res, 'Usuario no encontrado');
      }

      let profile;

      // Obtener perfil específico según el rol
      switch (user.rol) {
        case UserRole.ESTUDIANTE:
          profile = await usersService.getStudentProfile(userId);
          break;
        case UserRole.EMPRESA:
          profile = await usersService.getCompanyProfile(userId);
          break;
        case UserRole.INSTITUCION:
          profile = await usersService.getInstitutionProfile(userId);
          break;
        case UserRole.ADMIN:
          profile = user;
          break;
        default:
          profile = user;
      }

      return ApiResponseHandler.success(res, profile, 'Perfil obtenido exitosamente');
    } catch (error: any) {
      logger.error('Error obteniendo perfil de usuario:', error, {
        userId: req.params.userId,
        requestUserId: req.user?.id
      });
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Actualizar información básica del usuario
  async updateUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const updatedUser = await usersService.updateUser(req.user.id, req.body);

      return ApiResponseHandler.success(res, updatedUser, 'Usuario actualizado exitosamente');
    } catch (error: any) {
      logger.error('Error actualizando usuario:', error, {
        userId: req.user?.id,
        updateData: req.body
      });
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Actualizar perfil de estudiante
  async updateStudentProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }


      const updatedProfile = await usersService.updateStudentProfile(req.user.id, req.body);

      return ApiResponseHandler.success(res, updatedProfile, 'Perfil de estudiante actualizado exitosamente');
    } catch (error: any) {
      logger.error('Error actualizando perfil de estudiante:', error, {
        userId: req.user?.id,
        updateData: req.body
      });
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Actualizar perfil de empresa
  async updateCompanyProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const updatedProfile = await usersService.updateCompanyProfile(req.user.id, req.body);

      return ApiResponseHandler.success(res, updatedProfile, 'Perfil de empresa actualizado exitosamente');
    } catch (error: any) {
      logger.error('Error actualizando perfil de empresa:', error, {
        userId: req.user?.id,
        updateData: req.body
      });
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Actualizar perfil de institución
  async updateInstitutionProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const updatedProfile = await usersService.updateInstitutionProfile(req.user.id, req.body);

      return ApiResponseHandler.success(res, updatedProfile, 'Perfil de institución actualizado exitosamente');
    } catch (error: any) {
      logger.error('Error actualizando perfil de institución:', error, {
        userId: req.user?.id,
        updateData: req.body
      });
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Seguir a un usuario
  async followUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const { userId } = req.params;

      await usersService.followUser(req.user.id, userId);

      return ApiResponseHandler.created(res, null, 'Ahora sigues a este usuario');
    } catch (error: any) {
      logger.error('Error siguiendo usuario:', error, {
        followerId: req.user?.id,
        followedId: req.params.userId
      });

      switch (error.message) {
        case 'CANNOT_FOLLOW_SELF':
          return ApiResponseHandler.error(res, 'No puedes seguirte a ti mismo', 400);
        case 'ALREADY_FOLLOWING':
          return ApiResponseHandler.conflict(res, 'Ya sigues a este usuario');
        default:
          return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
      }
    }
  }

  // Dejar de seguir a un usuario
  async unfollowUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const { userId } = req.params;

      await usersService.unfollowUser(req.user.id, userId);

      return ApiResponseHandler.success(res, null, 'Ya no sigues a este usuario');
    } catch (error: any) {
      logger.error('Error dejando de seguir usuario:', error, {
        followerId: req.user?.id,
        followedId: req.params.userId
      });

      switch (error.message) {
        case 'NOT_FOLLOWING':
          return ApiResponseHandler.error(res, 'No sigues a este usuario', 400);
        default:
          return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
      }
    }
  }

  async viewProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const { userId } = req.params;

      await usersService.viewProfile(userId, req.user.id);

      return ApiResponseHandler.success(res, null, 'Perfil visto');
    } catch (error: any) {
      logger.error('Error viendo perfil:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Buscar usuarios
  async searchUsers(req: Request, res: Response) {
    try {
      const { page = '1', limit = '10', ...filters } = req.query;

      const result = await usersService.searchUsers(
        filters as any,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return ApiResponseHandler.successWithPagination(res, result, 'Usuarios encontrados');
    } catch (error: any) {
      logger.error('Error buscando usuarios:', error, {
        filters: req.query,
        requestUserId: req.user?.id
      });
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Obtener seguidores de un usuario
  async getFollowers(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = '1', limit = '10' } = req.query;

      // TODO: Implementar lógica para obtener seguidores con paginación
      // Por ahora retornamos una respuesta vacía
      return ApiResponseHandler.success(res, {
        data: [],
        pagination: {
          currentPage: parseInt(page as string),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit as string),
          hasNextPage: false,
          hasPrevPage: false
        }
      }, 'Seguidores obtenidos');
    } catch (error: any) {
      logger.error('Error obteniendo seguidores:', error, {
        userId: req.params.userId,
        requestUserId: req.user?.id
      });
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Obtener usuarios que sigue
  async getFollowing(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = '1', limit = '10' } = req.query;

      // TODO: Implementar lógica para obtener usuarios seguidos con paginación
      // Por ahora retornamos una respuesta vacía
      return ApiResponseHandler.success(res, {
        data: [],
        pagination: {
          currentPage: parseInt(page as string),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit as string),
          hasNextPage: false,
          hasPrevPage: false
        }
      }, 'Usuarios seguidos obtenidos');
    } catch (error: any) {
      logger.error('Error obteniendo usuarios seguidos:', error, {
        userId: req.params.userId,
        requestUserId: req.user?.id
      });
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Upload de avatar
  async uploadAvatar(req: Request, res: Response) {
    const upload = uploadConfigs.avatar.single('avatar');

    upload(req, res, async (err: any) => {
      try {
        if (err) {
          logger.error('Error en upload de avatar:', err);
          return ApiResponseHandler.error(res, err.message || 'Error al subir avatar', 400);
        }

        if (!req.file) {
          return ApiResponseHandler.error(res, 'No se ha proporcionado ningún archivo', 400);
        }

        if (!req.user) {
          return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
        }

        // Subir a Cloudinary
        const cloudinaryResult = await streamUpload(req.file.buffer, {
          folder: 'avatars',
          transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto' }
          ]
        });

        // Actualizar URL del avatar en la base de datos
        const updatedUser = await usersService.updateUser(req.user.id, {
          avatar: cloudinaryResult.secure_url
        } as any);

        logger.info('Avatar actualizado exitosamente', {
          userId: req.user.id,
          avatarUrl: cloudinaryResult.secure_url
        });

        return ApiResponseHandler.success(res, {
          avatar: cloudinaryResult.secure_url,
          user: updatedUser
        }, 'Avatar actualizado exitosamente');

      } catch (error: any) {
        logger.error('Error actualizando avatar:', error, {
          userId: req.user?.id
        });
        return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
      }
    });
  }

  // Upload de CV
  async uploadCV(req: Request, res: Response) {
    const upload = uploadConfigs.cv.single('cv');

    upload(req, res, async (err: any) => {
      try {
        if (err) {
          logger.error('Error en upload de CV:', err);
          return ApiResponseHandler.error(res, err.message || 'Error al subir CV', 400);
        }

        if (!req.file) {
          return ApiResponseHandler.error(res, 'No se ha proporcionado ningún archivo', 400);
        }

        if (!req.user) {
          return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
        }

        // Subir a Cloudinary con acceso público
        const cloudinaryResult = await streamUpload(req.file.buffer, {
          folder: 'cvs',
          resource_type: 'auto',
          access_mode: 'public',
          type: 'upload',
          use_filename: true,
          unique_filename: true,
          overwrite: false
        });

        // Actualizar URL del CV en el perfil de estudiante
        const updatedProfile = await usersService.updateStudentProfile(req.user.id, {
          cv: cloudinaryResult.secure_url
        } as any);

        logger.info('CV actualizado exitosamente', {
          userId: req.user.id,
          cvUrl: cloudinaryResult.secure_url
        });

        return ApiResponseHandler.success(res, {
          cvUrl: cloudinaryResult.secure_url,
          profile: updatedProfile
        }, 'CV actualizado exitosamente');

      } catch (error: any) {
        logger.error('Error actualizando CV:', error, {
          userId: req.user?.id
        });
        return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
      }
    });
  }

  // Desactivar usuario (solo admin)
  async deactivateUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const updatedUser = await usersService.updateUser(userId, {
        activo: false
      } as any);

      return ApiResponseHandler.success(res, updatedUser, 'Usuario desactivado exitosamente');
    } catch (error: any) {
      logger.error('Error desactivando usuario:', error, {
        userId: req.params.userId,
        adminId: req.user?.id
      });
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Activar usuario (solo admin)
  async activateUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const updatedUser = await usersService.updateUser(userId, {
        activo: true
      } as any);

      return ApiResponseHandler.success(res, updatedUser, 'Usuario activado exitosamente');
    } catch (error: any) {
      logger.error('Error activando usuario:', error, {
        userId: req.params.userId,
        adminId: req.user?.id
      });
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Upload imagen a galería
  async uploadGalleryImage(req: Request, res: Response) {
    const upload = uploadConfigs.gallery.single('image');

    upload(req, res, async (err: any) => {
      try {
        if (err) {
          logger.error('Error en upload de imagen de galería:', err);
          return ApiResponseHandler.error(res, err.message || 'Error al subir imagen', 400);
        }

        if (!req.file) {
          return ApiResponseHandler.error(res, 'No se ha proporcionado ningún archivo', 400);
        }

        if (!req.user) {
          return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
        }

        // Subir a Cloudinary
        const cloudinaryResult = await streamUpload(req.file.buffer, {
          folder: 'company-gallery',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' }
          ]
        });

        // Agregar a galería
        const updatedProfile = await usersService.addGalleryImage(
          req.user.id,
          cloudinaryResult.secure_url
        );

        logger.info('Imagen de galería subida exitosamente', {
          userId: req.user.id,
          imageUrl: cloudinaryResult.secure_url
        });

        return ApiResponseHandler.success(res, {
          imageUrl: cloudinaryResult.secure_url,
          profile: updatedProfile
        }, 'Imagen agregada a galería exitosamente');

      } catch (error: any) {
        logger.error('Error subiendo imagen de galería:', error, {
          userId: req.user?.id
        });
        return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
      }
    });
  }

  // Eliminar imagen de galería
  async deleteGalleryImage(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const { imageUrl } = req.body;

      if (!imageUrl) {
        return ApiResponseHandler.error(res, 'URL de imagen requerida', 400);
      }

      const updatedProfile = await usersService.removeGalleryImage(
        req.user.id,
        imageUrl
      );

      return ApiResponseHandler.success(res, updatedProfile, 'Imagen eliminada de galería');
    } catch (error: any) {
      logger.error('Error eliminando imagen de galería:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Agregar beneficio a empresa
  async addCompanyBenefit(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const { beneficioId, descripcion } = req.body;

      if (!beneficioId) {
        return ApiResponseHandler.error(res, 'ID de beneficio requerido', 400);
      }

      const benefit = await usersService.addCompanyBenefit(
        req.user.id,
        beneficioId,
        descripcion
      );

      return ApiResponseHandler.created(res, benefit, 'Beneficio agregado exitosamente');
    } catch (error: any) {
      logger.error('Error agregando beneficio:', error);
      
      if (error.message === 'BENEFIT_ALREADY_ADDED') {
        return ApiResponseHandler.conflict(res, 'Este beneficio ya fue agregado');
      }
      
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Eliminar beneficio de empresa
  async deleteCompanyBenefit(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const { benefitId } = req.params;

      await usersService.removeCompanyBenefit(req.user.id, benefitId);

      return ApiResponseHandler.success(res, null, 'Beneficio eliminado exitosamente');
    } catch (error: any) {
      logger.error('Error eliminando beneficio:', error);
      
      if (error.message === 'BENEFIT_NOT_FOUND') {
        return ApiResponseHandler.notFound(res, 'Beneficio no encontrado');
      }
      
      if (error.message === 'UNAUTHORIZED') {
        return ApiResponseHandler.forbidden(res, 'No autorizado');
      }
      
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }

  // Obtener beneficios de empresa
  async getCompanyBenefits(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponseHandler.unauthorized(res, 'Usuario no autenticado');
      }

      const benefits = await usersService.getCompanyBenefits(req.user.id);

      return ApiResponseHandler.success(res, benefits, 'Beneficios obtenidos exitosamente');
    } catch (error: any) {
      logger.error('Error obteniendo beneficios:', error);
      return ApiResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  }
}

export default new UsersController();