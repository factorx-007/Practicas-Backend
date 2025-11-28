import cloudinary, { streamUpload } from '../config/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import logger from '../utils/logger';

// Tipos para el servicio de upload
export interface UploadOptions {
  folder?: string;
  public_id?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: any[];
  tags?: string[];
  context?: Record<string, string>;
  quality?: string | number;
  format?: string;
}

export interface UploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
  folder?: string;
  tags?: string[];
}

export interface DeleteResult {
  result: string; // 'ok' si se eliminó correctamente
  public_id: string;
}

class UploadService {
  /**
   * Subir archivo a Cloudinary desde buffer usando el patrón oficial recomendado
   */
  async uploadFromBuffer(
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const uploadOptions = {
        resource_type: options.resource_type || 'auto',
        folder: options.folder || 'protalent',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        quality: options.quality || 'auto',
        timeout: 60000,
        ...options
      };

      // Usar el helper oficial de cloudinary config
      const result = await streamUpload(buffer, uploadOptions);

      if (!result) {
        throw new Error('No se recibió respuesta de Cloudinary');
      }

      const uploadResult: UploadResult = {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        created_at: result.created_at,
        folder: result.folder,
        tags: result.tags
      };

      logger.info('Archivo subido exitosamente a Cloudinary:', {
        public_id: result.public_id,
        secure_url: result.secure_url,
        bytes: result.bytes
      });

      return uploadResult;
    } catch (error: any) {
      logger.error('Error al subir archivo a Cloudinary:', error);
      throw new Error(`Error de Cloudinary: ${error.message}`);
    }
  }

  /**
   * Subir imagen con optimizaciones específicas
   */
  async uploadImage(
    buffer: Buffer,
    folder: string = 'protalent/images',
    options: Partial<UploadOptions> = {}
  ): Promise<UploadResult> {
    const imageOptions: UploadOptions = {
      resource_type: 'image',
      folder,
      quality: 'auto:good',
      transformation: [
        { quality: 'auto' }
      ],
      ...options
    };

    return this.uploadFromBuffer(buffer, imageOptions);
  }

  /**
   * Subir video con optimizaciones específicas
   */
  async uploadVideo(
    buffer: Buffer,
    folder: string = 'protalent/videos',
    options: Partial<UploadOptions> = {}
  ): Promise<UploadResult> {
    const videoOptions: UploadOptions = {
      resource_type: 'video',
      folder,
      quality: 'auto',
      ...options
    };

    return this.uploadFromBuffer(buffer, videoOptions);
  }

  /**
   * Subir archivo de perfil (avatar, logo, CV)
   */
  async uploadProfileFile(
    buffer: Buffer,
    userId: string,
    fileType: 'avatar' | 'logo' | 'cv',
    options: Partial<UploadOptions> = {}
  ): Promise<UploadResult> {
    const folder = `protalent/profiles/${fileType}s`;
    const public_id = `${userId}_${fileType}_${Date.now()}`;

    const profileOptions: UploadOptions = {
      folder,
      public_id,
      resource_type: fileType === 'cv' ? 'raw' : 'image',
      tags: [`user_${userId}`, fileType, 'profile'],
      context: {
        user_id: userId,
        file_type: fileType,
        uploaded_at: new Date().toISOString()
      },
      // Ensure public access for CVs and avatars
      ...(fileType === 'cv' ? { 
        access_mode: 'public',
        type: 'upload'
      } : {}),
      ...options
    };

    return this.uploadFromBuffer(buffer, profileOptions);
  }

  /**
   * Subir archivo para post social
   */
  async uploadPostMedia(
    buffer: Buffer,
    userId: string,
    postId: string,
    mediaType: 'image' | 'video',
    options: Partial<UploadOptions> = {}
  ): Promise<UploadResult> {
    const folder = `protalent/posts/${mediaType}s`;
    const public_id = `post_${postId}_${userId}_${Date.now()}`;

    const postOptions: UploadOptions = {
      folder,
      public_id,
      resource_type: mediaType,
      tags: [`user_${userId}`, `post_${postId}`, mediaType, 'social'],
      context: {
        user_id: userId,
        post_id: postId,
        media_type: mediaType,
        uploaded_at: new Date().toISOString()
      },
      ...options
    };

    if (mediaType === 'image') {
      return this.uploadImage(buffer, folder, postOptions);
    } else {
      return this.uploadVideo(buffer, folder, postOptions);
    }
  }

  /**
   * Eliminar archivo de Cloudinary
   */
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<DeleteResult> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });

      logger.info('Archivo eliminado de Cloudinary:', {
        public_id: publicId,
        result: result.result
      });

      return {
        result: result.result,
        public_id: publicId
      };
    } catch (error) {
      logger.error('Error al eliminar archivo de Cloudinary:', error);
      throw new Error('Error al eliminar el archivo');
    }
  }

  /**
   * Obtener información de un archivo
   */
  async getFileInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      logger.error('Error al obtener información del archivo:', error);
      throw new Error('Error al obtener información del archivo');
    }
  }

  /**
   * Listar archivos de una carpeta
   */
  async listFiles(
    folder: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
    maxResults: number = 50
  ): Promise<any> {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        resource_type: resourceType,
        prefix: folder,
        max_results: maxResults
      });
      return result;
    } catch (error) {
      logger.error('Error al listar archivos:', error);
      throw new Error('Error al listar archivos');
    }
  }

  /**
   * Generar URL transformada para un archivo
   */
  generateTransformedUrl(
    publicId: string,
    transformations: any[] = [],
    options: { format?: string; quality?: string | number; secure?: boolean } = {}
  ): string {
    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: options.secure !== false,
      quality: options.quality || 'auto',
      fetch_format: options.format || 'auto'
    });
  }

  /**
   * Generar URLs de diferentes tamaños para una imagen
   */
  generateImageSizes(publicId: string): {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  } {
    return {
      thumbnail: this.generateTransformedUrl(publicId, [{ width: 150, height: 150, crop: 'fill' }]),
      small: this.generateTransformedUrl(publicId, [{ width: 300, height: 300, crop: 'limit' }]),
      medium: this.generateTransformedUrl(publicId, [{ width: 600, height: 600, crop: 'limit' }]),
      large: this.generateTransformedUrl(publicId, [{ width: 1200, height: 1200, crop: 'limit' }]),
      original: this.generateTransformedUrl(publicId)
    };
  }

  /**
   * Validar tipo de archivo permitido
   */
  isValidFileType(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimetype);
  }

  /**
   * Validar tamaño de archivo
   */
  isValidFileSize(size: number, maxSize: number = 10 * 1024 * 1024): boolean { // 10MB por defecto
    return size <= maxSize;
  }

  /**
   * Obtener configuración de tipos de archivo por categoría
   */
  getFileTypeConfig(category: 'image' | 'video' | 'document' | 'avatar' | 'cv') {
    const configs = {
      image: {
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxSize: 10 * 1024 * 1024, // 10MB
        folder: 'protalent/images'
      },
      video: {
        allowedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
        maxSize: 100 * 1024 * 1024, // 100MB
        folder: 'protalent/videos'
      },
      document: {
        allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        maxSize: 10 * 1024 * 1024, // 10MB
        folder: 'protalent/documents'
      },
      avatar: {
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: 5 * 1024 * 1024, // 5MB
        folder: 'protalent/profiles/avatars'
      },
      cv: {
        allowedTypes: ['application/pdf'],
        maxSize: 10 * 1024 * 1024, // 10MB
        folder: 'protalent/profiles/cvs'
      }
    };

    return configs[category];
  }
}

// Exportar instancia única del servicio
const uploadService = new UploadService();
export default uploadService;