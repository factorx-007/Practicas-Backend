import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

// Configuración básica de Swagger/OpenAPI
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ProTalent API',
      version: '1.0.0',
      description: 'API Backend para la plataforma ProTalent - Conectando empresas con talento joven',
      contact: {
        name: 'ProTalent Team',
        email: 'support@protalent.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Servidor de Desarrollo'
      },
      {
        url: 'https://api.protalent.com',
        description: 'Servidor de Producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint /api/auth/login'
        }
      },
      schemas: {
        // Esquemas de respuesta común
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica si la operación fue exitosa'
            },
            message: {
              type: 'string',
              description: 'Mensaje descriptivo de la respuesta'
            },
            data: {
              type: 'object',
              description: 'Datos de la respuesta'
            },
            error: {
              type: 'string',
              description: 'Código de error si existe'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'array',
              items: {}
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' }
              }
            }
          }
        },
        // Esquemas de usuario
        UserRole: {
          type: 'string',
          enum: ['ESTUDIANTE', 'EMPRESA', 'INSTITUCION', 'ADMIN'],
          description: 'Rol del usuario en la plataforma'
        },
        StudentType: {
          type: 'string',
          enum: ['ESTUDIANTE', 'EGRESADO'],
          description: 'Tipo de estudiante'
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nombre: { type: 'string' },
            apellido: { type: 'string' },
            email: { type: 'string', format: 'email' },
            avatar: { type: 'string', nullable: true },
            rol: { $ref: '#/components/schemas/UserRole' },
            activo: { type: 'boolean' },
            emailVerificado: { type: 'boolean' },
            perfilCompleto: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Student: {
          allOf: [
            { $ref: '#/components/schemas/User' },
            {
              type: 'object',
              properties: {
                cv: { type: 'string', nullable: true },
                carrera: { type: 'string' },
                universidad: { type: 'string', nullable: true },
                anio_ingreso: { type: 'integer', nullable: true },
                anio_egreso: { type: 'integer', nullable: true },
                telefono: { type: 'string', nullable: true },
                habilidades: {
                  type: 'array',
                  items: { type: 'string' }
                },
                experiencia: {
                  type: 'array',
                  nullable: true,
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', nullable: true },
                      empresa: { type: 'string' },
                      puesto: { type: 'string' },
                      descripcion: { type: 'string', nullable: true },
                      fechaInicio: { type: 'string', format: 'date' },
                      fechaFin: { type: 'string', format: 'date', nullable: true },
                      esTrabajoActual: { type: 'boolean', nullable: true },
                      ubicacion: { type: 'string', nullable: true },
                      tipo: {
                        type: 'string',
                        enum: ['TIEMPO_COMPLETO','MEDIO_TIEMPO','FREELANCE','PRACTICAS','VOLUNTARIADO'],
                        nullable: true
                      },
                      habilidades: {
                        type: 'array',
                        items: { type: 'string' },
                        nullable: true
                      }
                    },
                    required: ['empresa','puesto','fechaInicio']
                  }
                },
                portafolio: { type: 'string', nullable: true },
                linkedin: { type: 'string', nullable: true },
                github: { type: 'string', nullable: true },
                ubicacion: { type: 'string', nullable: true },
                tipo: { $ref: '#/components/schemas/StudentType' }
              }
            }
          ]
        },
        Company: {
          allOf: [
            { $ref: '#/components/schemas/User' },
            {
              type: 'object',
              properties: {
                ruc: { type: 'string' },
                nombre_empresa: { type: 'string' },
                rubro: { type: 'string' },
                descripcion: { type: 'string', nullable: true },
                direccion: { type: 'string', nullable: true },
                telefono: { type: 'string', nullable: true },
                website: { type: 'string', nullable: true },
                logo_url: { type: 'string', nullable: true },
                verificada: { type: 'boolean' }
              }
            }
          ]
        },
        Institution: {
          allOf: [
            { $ref: '#/components/schemas/User' },
            {
              type: 'object',
              properties: {
                codigo_institucional: { type: 'string' },
                nombre: { type: 'string' },
                tipo: { type: 'string' },
                direccion: { type: 'string', nullable: true },
                telefono: { type: 'string', nullable: true },
                website: { type: 'string', nullable: true },
                logo_url: { type: 'string', nullable: true }
              }
            }
          ]
        },
        // Esquemas de ofertas
        ModalidadTrabajo: {
          type: 'string',
          enum: ['TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'PRACTICA', 'FREELANCE', 'REMOTO', 'HIBRIDO', 'PRESENCIAL'],
          description: 'Modalidad de trabajo de la oferta'
        },
        EstadoOferta: {
          type: 'string',
          enum: ['PUBLICADA', 'CERRADA', 'BORRADOR', 'PAUSADA'],
          description: 'Estado actual de la oferta'
        },
        EstadoPostulacion: {
          type: 'string',
          enum: ['PENDIENTE', 'EN_REVISION', 'ACEPTADA', 'RECHAZADA', 'ENTREVISTA'],
          description: 'Estado de la postulación'
        },
        Offer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            titulo: { type: 'string' },
            descripcion: { type: 'string', nullable: true },
            requisitos: {
              type: 'array',
              items: { type: 'string' }
            },
            duracion: { type: 'string', nullable: true },
            estado: { $ref: '#/components/schemas/EstadoOferta' },
            ubicacion: { type: 'string', nullable: true },
            modalidad: { $ref: '#/components/schemas/ModalidadTrabajo' },
            salario_min: { type: 'number', nullable: true },
            salario_max: { type: 'number', nullable: true },
            moneda: { type: 'string', default: 'PEN' },
            requiereCV: { type: 'boolean', default: true },
            requiereCarta: { type: 'boolean', default: false },
            fecha_limite: { type: 'string', format: 'date-time', nullable: true },
            vistas: { type: 'integer', default: 0 },
            empresaId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Application: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            mensaje: { type: 'string', nullable: true },
            estado: { $ref: '#/components/schemas/EstadoPostulacion' },
            estudianteId: { type: 'string' },
            ofertaId: { type: 'string' },
            fechaEntrevista: { type: 'string', format: 'date-time', nullable: true },
            cv_url: { type: 'string', nullable: true },
            comentarioEmpresa: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        // Esquemas de error
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Errores de validación' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acceso requerido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Token de acceso requerido',
                error: 'UNAUTHORIZED'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'No tienes permisos para realizar esta acción',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'No tienes permisos para realizar esta acción',
                error: 'FORBIDDEN'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Recurso no encontrado',
                error: 'NOT_FOUND'
              }
            }
          }
        },
        ValidationError: {
          description: 'Errores de validación en los datos enviados',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Error interno del servidor',
                error: 'INTERNAL_SERVER_ERROR'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints de autenticación y autorización'
      },
      {
        name: 'Users',
        description: 'Gestión de usuarios y perfiles'
      },
      {
        name: 'Offers',
        description: 'Gestión de ofertas de trabajo y postulaciones'
      },
      {
        name: 'Posts',
        description: 'Sistema social de publicaciones (futuro)'
      },
      {
        name: 'Chat',
        description: 'Sistema de mensajería en tiempo real (futuro)'
      },
      {
        name: 'Notifications',
        description: 'Sistema de notificaciones (futuro)'
      }
    ]
  },
  apis: [
    './src/routes/*.ts', // Archivos donde están las rutas con documentación JSDoc
    './src/controllers/*.ts', // Controladores con documentación
    './src/types/*.ts' // Tipos TypeScript
  ]
};

// Generar especificación de Swagger
const specs = swaggerJsdoc(options);

// Opciones de Swagger UI
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'list', // 'list', 'full' o 'none'
    filter: true,
    showRequestDuration: true,
    syntaxHighlight: {
      activated: true,
      theme: 'agate'
    },
    tryItOutEnabled: true
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c3e50; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 15px; border-radius: 5px; }
  `,
  customSiteTitle: 'ProTalent API Documentation',
  customfavIcon: '/favicon.ico'
};

/**
 * Configurar Swagger en la aplicación Express
 * @param app - Aplicación Express
 */
export const setupSwagger = (app: Application): void => {
  // Ruta para la documentación JSON/YAML
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Ruta para servir Swagger UI
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(specs, swaggerUiOptions));

  // Información en los logs
  console.log(`📚 Swagger UI disponible en: ${process.env.API_BASE_URL || 'http://localhost:3000'}/api-docs`);
  console.log(`📄 Especificación JSON disponible en: ${process.env.API_BASE_URL || 'http://localhost:3000'}/api-docs.json`);
};

export { specs };
export default { setupSwagger, specs };