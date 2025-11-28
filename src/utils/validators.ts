import { body, param, query, ValidationChain } from 'express-validator';
import { UserRole, StudentType, OfferStatus, ModalidadTrabajo } from '../types/common.types';

// Validadores comunes
export const commonValidators = {
  // Email
  email: () => body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido'),

  // Password
  password: () => body('password')
    .isLength({ min: 8 })
    .withMessage('Password debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password debe contener al menos una minúscula, una mayúscula y un número'),

  // Nombres
  nombre: () => body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios'),

  apellido: () => body('apellido')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Apellido solo puede contener letras y espacios'),

  // Rol
  rol: () => body('rol')
    .isIn(Object.values(UserRole))
    .withMessage('Rol no válido'),

  // ID
  id: (field: string = 'id') => param(field)
    .isString()
    .notEmpty()
    .withMessage(`${field} es requerido`),

  // Paginación
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page debe ser un número entero mayor a 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit debe ser un número entre 1 y 100'),
    query('sortBy')
      .optional()
      .isString()
      .withMessage('SortBy debe ser una cadena'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('SortOrder debe ser asc o desc')
  ]
};

// Validadores para autenticación
export const authValidators = {
  register: () => [
    commonValidators.nombre(),
    commonValidators.apellido(),
    commonValidators.email(),
    commonValidators.password(),
    commonValidators.rol()
  ],

  login: () => [
    commonValidators.email(),
    body('password')
      .notEmpty()
      .withMessage('Password es requerido')
  ],

  changePassword: () => [
    body('currentPassword')
      .notEmpty()
      .withMessage('Password actual es requerido'),
    commonValidators.password()
      .withMessage('Nuevo password no válido')
  ],

  resetPassword: () => [
    commonValidators.email()
  ],

  confirmReset: () => [
    body('token')
      .notEmpty()
      .withMessage('Token es requerido'),
    commonValidators.password()
  ]
};

// Validadores para estudiantes
export const studentValidators = {
  updateProfile: () => [
    body('carrera')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Carrera debe tener entre 2 y 100 caracteres'),
    
    body('universidad')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Universidad debe tener entre 2 y 100 caracteres'),
    
    body('anio_ingreso')
      .optional()
      .isInt({ min: 1950, max: new Date().getFullYear() })
      .withMessage('Año de ingreso no válido'),
    
    body('anio_egreso')
      .optional()
      .isInt({ min: 1950, max: new Date().getFullYear() + 10 })
      .withMessage('Año de egreso no válido'),
    
    body('telefono')
      .optional()
      .matches(/^[+]?[\d\s\-()]+$/)
      .withMessage('Teléfono no válido'),
    
    body('habilidades')
      .optional()
      .isArray()
      .withMessage('Habilidades debe ser un array'),
    
    body('habilidades.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Cada habilidad debe tener entre 1 y 50 caracteres'),
    
    body('tipo')
      .optional()
      .isIn(Object.values(StudentType))
      .withMessage('Tipo de estudiante no válido'),
    
    body('linkedin')
      .optional()
      .isURL()
      .withMessage('LinkedIn debe ser una URL válida'),
    
    body('github')
      .optional()
      .isURL()
      .withMessage('GitHub debe ser una URL válida'),
    
    body('portafolio')
      .optional()
      .isURL()
      .withMessage('Portafolio debe ser una URL válida'),

    // experiencia ahora es JSON (array de objetos)
    body('experiencia')
      .optional()
      .isArray()
      .withMessage('Experiencia debe ser un array de objetos válidos'),

    body('experiencia.*')
      .optional()
      .isObject()
      .withMessage('Cada elemento de experiencia debe ser un objeto'),

    body('experiencia.*.empresa')
      .optional()
      .isString()
      .isLength({ min: 1, max: 200 })
      .withMessage('empresa debe ser texto (1-200)'),

    body('experiencia.*.puesto')
      .optional()
      .isString()
      .isLength({ min: 1, max: 200 })
      .withMessage('puesto debe ser texto (1-200)'),

    body('experiencia.*.descripcion')
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage('descripcion no puede exceder 2000 caracteres'),

    body('experiencia.*.fechaInicio')
      .optional()
      .isISO8601()
      .withMessage('fechaInicio debe ser una fecha válida (YYYY-MM-DD)'),

    body('experiencia.*.fechaFin')
      .optional()
      .isISO8601()
      .withMessage('fechaFin debe ser una fecha válida (YYYY-MM-DD)'),

    body('experiencia.*.esTrabajoActual')
      .optional()
      .isBoolean()
      .withMessage('esTrabajoActual debe ser booleano'),

    body('experiencia.*.ubicacion')
      .optional()
      .isString()
      .isLength({ min: 1, max: 200 })
      .withMessage('ubicacion debe ser texto (1-200)'),

    body('experiencia.*.tipo')
      .optional()
      .isIn(['TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'FREELANCE', 'PRACTICAS', 'VOLUNTARIADO'])
      .withMessage('tipo no válido'),

    body('experiencia.*.habilidades')
      .optional()
      .isArray()
      .withMessage('habilidades debe ser un array de strings'),

    body('experiencia.*.habilidades.*')
      .optional()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('cada habilidad debe ser texto (1-50)'),

    body('ubicacion')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Ubicación debe tener entre 2 y 100 caracteres'),

    body('cv')
      .optional()
      .isURL()
      .withMessage('CV debe ser una URL válida')

    // NOTA: Los campos semestreActual, promedioAcademico fueron removidos
    // porque no existen en la base de datos. Se usan anio_ingreso y anio_egreso en su lugar.
  ]
};

// Validadores para empresas
export const companyValidators = {
  registerCompany: () => [
    body('ruc')
      .trim()
      .isLength({ min: 11, max: 11 })
      .withMessage('RUC debe tener 11 dígitos')
      .isNumeric()
      .withMessage('RUC debe contener solo números'),
    
    body('nombre_empresa')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nombre de empresa debe tener entre 2 y 100 caracteres'),
    
    body('rubro')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Rubro debe tener entre 2 y 50 caracteres')
  ],

  updateProfile: () => [
    body('nombre_empresa')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nombre de empresa debe tener entre 2 y 100 caracteres'),
    
    body('rubro')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Rubro debe tener entre 2 y 50 caracteres'),
    
    body('descripcion')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Descripción no puede exceder 1000 caracteres'),
    
    body('website')
      .optional()
      .custom((value) => {
        if (!value) return true;
        // Allow localhost URLs in development
        if (value.startsWith('http://localhost') || value.startsWith('https://localhost')) {
          return true;
        }
        // Validate as URL for production
        try {
          new URL(value);
          return true;
        } catch {
          throw new Error('Website debe ser una URL válida');
        }
      })
      .withMessage('Website debe ser una URL válida'),
    
    body('telefono')
      .optional()
      .matches(/^[+]?[\d\s\-()]+$/)
      .withMessage('Teléfono no válido'),
    
    // Validadores para perfilEmpresa (anidado)
    body('perfilEmpresa')
      .optional()
      .isObject()
      .withMessage('perfilEmpresa debe ser un objeto'),
    
    body('perfilEmpresa.upsert')
      .optional()
      .isObject()
      .withMessage('perfilEmpresa.upsert debe ser un objeto'),
    
    body('perfilEmpresa.upsert.create')
      .optional()
      .isObject()
      .withMessage('perfilEmpresa.upsert.create debe ser un objeto'),
    
    body('perfilEmpresa.upsert.update')
      .optional()
      .isObject()
      .withMessage('perfilEmpresa.upsert.update debe ser un objeto')
  ]
};

// Validadores para ofertas
export const offerValidators = {
  createOffer: () => [
    body('titulo')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Título debe tener entre 5 y 100 caracteres'),
    
    body('descripcion')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Descripción no puede exceder 2000 caracteres'),
    
    body('requisitos')
      .optional()
      .isArray()
      .withMessage('Requisitos debe ser un array'),
    
    body('modalidad')
      .optional()
      .isIn(Object.values(ModalidadTrabajo))
      .withMessage('Modalidad de trabajo no válida'),
    
    body('salario_min')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Salario mínimo debe ser un número positivo'),
    
    body('salario_max')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Salario máximo debe ser un número positivo'),
    
    body('fecha_limite')
      .optional()
      .isISO8601()
      .withMessage('Fecha límite debe ser una fecha válida')
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Fecha límite debe ser futura');
        }
        return true;
      })
  ],

  updateOffer: () => [
    commonValidators.id('id'),
    ...offerValidators.createOffer()
  ]
};

// Validadores para posts
export const postValidators = {
  createPost: () => [
    body('contenido')
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Contenido debe tener entre 1 y 2000 caracteres'),
    
    body('privado')
      .optional()
      .isBoolean()
      .withMessage('Privado debe ser un valor booleano')
  ],

  updatePost: () => [
    commonValidators.id('id'),
    body('contenido')
      .optional()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Contenido debe tener entre 1 y 2000 caracteres')
  ]
};

// Validadores para comentarios
export const commentValidators = {
  createComment: () => [
    body('contenido')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Comentario debe tener entre 1 y 500 caracteres'),
    
    body('parentId')
      .optional()
      .isString()
      .withMessage('Parent ID debe ser una cadena válida')
  ]
};

// Validador para búsquedas
export const searchValidators = {
  search: () => [
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Búsqueda debe tener entre 1 y 100 caracteres'),
    
    query('rol')
      .optional()
      .isIn(Object.values(UserRole))
      .withMessage('Rol no válido')
  ]
};

export default {
  common: commonValidators,
  auth: authValidators,
  student: studentValidators,
  company: companyValidators,
  offer: offerValidators,
  post: postValidators,
  comment: commentValidators,
  search: searchValidators
};