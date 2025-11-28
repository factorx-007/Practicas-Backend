import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse, 
  TokenPair,
  GoogleAuthRequest,
  ChangePasswordRequest
} from '../types/auth.types';
import { UserRole, StudentType, TipoInstitucion } from '../types/common.types';
import { passwordUtils, jwtUtils, stringUtils } from '../utils/helpers';
import logger from '../utils/logger';

export class AuthService {
  // Registrar nuevo usuario
  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Verificar si el email ya existe
      const existingUser = await prisma.usuario.findUnique({
        where: { email: registerData.email }
      });

      if (existingUser) {
        throw new Error('EMAIL_ALREADY_EXISTS');
      }

      // Verificar RUC para empresas
      if (registerData.rol === UserRole.EMPRESA && registerData.empresa) {
        const existingCompany = await prisma.empresa.findUnique({
          where: { ruc: registerData.empresa.ruc }
        });

        if (existingCompany) {
          throw new Error('RUC_ALREADY_EXISTS');
        }
      }

      // Verificar código institucional
      if (registerData.rol === UserRole.INSTITUCION && registerData.institucion) {
        const existingInstitution = await prisma.institucion.findUnique({
          where: { codigo: registerData.institucion.codigo }
        });

        if (existingInstitution) {
          throw new Error('INSTITUTION_CODE_ALREADY_EXISTS');
        }
      }

      // Hash password
      const hashedPassword = await passwordUtils.hash(registerData.password);

      // Crear usuario en transacción
      const result = await prisma.$transaction(async (tx) => {
        // Crear usuario base
        const user = await tx.usuario.create({
          data: {
            nombre: registerData.nombre,
            apellido: registerData.apellido,
            email: registerData.email,
            password: hashedPassword,
            rol: registerData.rol,
            emailVerificado: false,
            perfilCompleto: false
          }
        });

        // Crear perfil específico según el rol
        switch (registerData.rol) {
          case UserRole.ESTUDIANTE:
            // Crear perfil de estudiante con datos del frontend o valores por defecto
            await tx.estudiante.create({
              data: {
                usuarioId: user.id,
                carrera: registerData.carrera || '',
                universidad: registerData.universidad || '',
                tipo: StudentType.ESTUDIANTE,
                habilidades: []
              }
            });
            break;

          case UserRole.EMPRESA:
            // Crear perfil de empresa con datos del frontend o valores por defecto
            // Generar RUC temporal único para evitar constraint violations
            const tempRuc = `TEMP_${user.id}_${Date.now()}`;
            await tx.empresa.create({
              data: {
                usuarioId: user.id,
                ruc: registerData.empresa?.ruc || tempRuc,
                nombre_empresa: registerData.empresa?.nombre_empresa || registerData.nombreEmpresa || '',
                rubro: registerData.empresa?.rubro || '',
                descripcion: registerData.empresa?.descripcion || '',
                verificada: false
              }
            });
            break;

          case UserRole.INSTITUCION:
            // Crear perfil de institución con datos del frontend o valores por defecto
            // Generar código temporal único para evitar constraint violations
            const tempCodigo = `TEMP_${user.id}_${Date.now()}`;
            await tx.institucion.create({
              data: {
                usuarioId: user.id,
                nombre: registerData.institucion?.nombre || registerData.nombreInstitucion || '',
                tipo: (registerData.institucion?.tipo as TipoInstitucion) || TipoInstitucion.UNIVERSIDAD,
                codigo: registerData.institucion?.codigo || tempCodigo
              }
            });
            break;
        }

        return user;
      });

      // Generar tokens
      const tokens = jwtUtils.generateTokenPair({
        userId: result.id,
        email: result.email,
        rol: result.rol as UserRole
      });

      logger.auth('Usuario registrado exitosamente', result.id, result.email, {
        rol: result.rol
      });

      return {
        user: {
          id: result.id,
          nombre: result.nombre,
          apellido: result.apellido,
          email: result.email,
          avatar: result.avatar || undefined,
          rol: result.rol as UserRole,
          emailVerificado: result.emailVerificado,
          perfilCompleto: result.perfilCompleto
        },
        tokens
      };
    } catch (error: any) {
      logger.error('Error en registro de usuario:', error, {
        email: registerData.email,
        rol: registerData.rol
      });
      throw error;
    }
  }

  // Login de usuario
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      // Buscar usuario
      const user = await prisma.usuario.findUnique({
        where: { email: loginData.email },
        include: {
          estudiante: true,
          empresa: true,
          institucion: true
        }
      });

      if (!user) {
        logger.security('Intento de login con email inexistente', '', {
          email: loginData.email
        });
        throw new Error('INVALID_CREDENTIALS');
      }

      if (!user.activo) {
        logger.security('Intento de login con cuenta desactivada', '', {
          userId: user.id,
          email: user.email
        });
        throw new Error('ACCOUNT_DISABLED');
      }

      // Verificar password
      if (!user.password) {
        throw new Error('PASSWORD_NOT_SET');
      }

      const isValidPassword = await passwordUtils.verify(loginData.password, user.password);
      if (!isValidPassword) {
        logger.security('Intento de login con contraseña incorrecta', '', {
          userId: user.id,
          email: user.email
        });
        throw new Error('INVALID_CREDENTIALS');
      }

      // Verificar si el perfil está completo
      const perfilCompleto = this.checkProfileCompletion(user);
      
      if (user.perfilCompleto !== perfilCompleto) {
        await prisma.usuario.update({
          where: { id: user.id },
          data: { perfilCompleto }
        });
      }

      // Generar tokens
      const tokens = jwtUtils.generateTokenPair({
        userId: user.id,
        email: user.email,
        rol: user.rol as UserRole
      });

      logger.auth('Login exitoso', user.id, user.email, {
        rol: user.rol
      });

      return {
        user: {
          id: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          avatar: user.avatar || undefined,
          rol: user.rol as UserRole,
          emailVerificado: user.emailVerificado,
          perfilCompleto
        },
        tokens
      };
    } catch (error: any) {
      logger.error('Error en login:', error, {
        email: loginData.email
      });
      throw error;
    }
  }

  // Login con Google OAuth
  async googleAuth(googleData: GoogleAuthRequest): Promise<AuthResponse> {
    try {
      // Buscar usuario existente por Google ID o email
      let user = await prisma.usuario.findFirst({
        where: {
          OR: [
            { googleId: googleData.googleId },
            { email: googleData.email }
          ]
        },
        include: {
          estudiante: true,
          empresa: true,
          institucion: true
        }
      });

      if (user) {
        // Usuario existe, actualizar Google ID si no lo tiene
        if (!user.googleId) {
          user = await prisma.usuario.update({
            where: { id: user.id },
            data: { googleId: googleData.googleId },
            include: {
              estudiante: true,
              empresa: true,
              institucion: true
            }
          });
        }
      } else {
        // Crear nuevo usuario
        const newUser = await prisma.$transaction(async (tx) => {
          const createdUser = await tx.usuario.create({
            data: {
              nombre: googleData.nombre,
              apellido: googleData.apellido,
              email: googleData.email,
              googleId: googleData.googleId,
              avatar: googleData.avatar || undefined,
              rol: googleData.rol,
              emailVerificado: true, // Google emails están verificados
              perfilCompleto: false
            }
          });

          // Crear perfil básico según el rol
          if (googleData.rol === UserRole.ESTUDIANTE) {
            await tx.estudiante.create({
              data: {
                usuarioId: createdUser.id,
                carrera: '',
                tipo: StudentType.ESTUDIANTE,
                habilidades: []
              }
            });
          }

          return createdUser;
        });

        // Obtener el usuario completo con includes
        user = await prisma.usuario.findUnique({
          where: { id: newUser.id },
          include: {
            estudiante: true,
            empresa: true,
            institucion: true
          }
        });

        if (!user) {
          throw new Error('USER_CREATION_FAILED');
        }
      }

      // Verificar si está activo
      if (!user || !user.activo) {
        throw new Error('ACCOUNT_DISABLED');
      }

      // Generar tokens
      const tokens = jwtUtils.generateTokenPair({
        userId: user.id,
        email: user.email,
        rol: user.rol as UserRole
      });

      logger.auth('Login con Google exitoso', user.id, user.email, {
        rol: user.rol,
        googleId: googleData.googleId
      });

      return {
        user: {
          id: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          avatar: user.avatar || undefined,
          rol: user.rol as UserRole,
          emailVerificado: user.emailVerificado,
          perfilCompleto: this.checkProfileCompletion(user)
        },
        tokens
      };
    } catch (error: any) {
      logger.error('Error en Google Auth:', error, {
        email: googleData.email,
        googleId: googleData.googleId
      });
      throw error;
    }
  }

  // Refrescar tokens
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Verificar refresh token
      const payload = jwtUtils.verifyRefreshToken(refreshToken);

      // Verificar que el usuario existe
      const user = await prisma.usuario.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, rol: true, activo: true }
      });

      if (!user || !user.activo) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }

      // Generar nuevos tokens
      const tokens = jwtUtils.generateTokenPair({
        userId: user.id,
        email: user.email,
        rol: user.rol as UserRole
      });

      logger.auth('Tokens refrescados', user.id, user.email);

      return tokens;
    } catch (error: any) {
      logger.error('Error refrescando tokens:', error);
      throw new Error('INVALID_REFRESH_TOKEN');
    }
  }

  // Cambiar contraseña
  async changePassword(userId: string, changePasswordData: ChangePasswordRequest): Promise<void> {
    try {
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { id: true, password: true, email: true }
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      if (!user.password) {
        throw new Error('PASSWORD_NOT_SET');
      }

      // Verificar contraseña actual
      const isValidPassword = await passwordUtils.verify(
        changePasswordData.currentPassword, 
        user.password
      );

      if (!isValidPassword) {
        throw new Error('INVALID_CURRENT_PASSWORD');
      }

      // Hash nueva contraseña
      const hashedPassword = await passwordUtils.hash(changePasswordData.newPassword);

      // Actualizar contraseña
      await prisma.usuario.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      logger.auth('Contraseña cambiada', userId, user.email);
    } catch (error: any) {
      logger.error('Error cambiando contraseña:', error, { userId });
      throw error;
    }
  }

  // Verificar completitud del perfil
  private checkProfileCompletion(user: any): boolean {
    // Verificar información básica requerida
    const hasBasicInfo = !!(user.nombre && user.apellido && user.email);

    // Para usuarios recién registrados, consideramos completo si tienen info básica
    // TODO: Más adelante se puede expandir esto para requerir más información por rol
    switch (user.rol) {
      case UserRole.ESTUDIANTE:
        // Perfil básico completo si tiene nombre, apellido y email
        // En el futuro: + universidad + carrera
        return hasBasicInfo;

      case UserRole.EMPRESA:
        // Perfil básico completo si tiene nombre, apellido y email
        // En el futuro: + nombre empresa + ruc + rubro
        return hasBasicInfo;

      case UserRole.INSTITUCION:
        // Perfil básico completo si tiene nombre, apellido y email
        // En el futuro: + nombre institución + código
        return hasBasicInfo;

      case UserRole.ADMIN:
        return hasBasicInfo;

      default:
        return false;
    }
  }

  // Logout (invalidar tokens - para futuro con blacklist)
  async logout(userId: string): Promise<void> {
    logger.auth('Logout exitoso', userId);
    // En el futuro, aquí se podría agregar tokens a una blacklist
  }
}

export default new AuthService();