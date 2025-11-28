import { UsersService } from '@/services/users.service';
import prisma from '@/config/database';
import { UpdateStudentProfileRequest } from '@/types/user.types';
import { Rol, TipoEstudiante, DisponibilidadTipo, ModalidadTrabajo, TipoInstitucion, NivelAcademico, SistemaNotas, TipoProyecto, EstadoProyecto, NivelDominio, CategoriaHabilidad, TipoHabilidad } from '@prisma/client';

// Un-mock Prisma for this test file to allow real database interaction
jest.unmock('@/config/database');

describe('UsersService - Integration Test', () => {
  let usersService: UsersService;
  let testUser: any;
  let testHabilidad: any;

  beforeAll(async () => {
    usersService = new UsersService();

    // Create a skill to link to
    testHabilidad = await prisma.catalogoHabilidad.create({
      data: {
        nombre: `TestSkill-${Date.now()}`,
        categoria: CategoriaHabilidad.LENGUAJE_PROGRAMACION,
        tipo: TipoHabilidad.TECNICA,
      },
    });

    // Create a dedicated test user for this suite
    testUser = await prisma.usuario.create({
      data: {
        nombre: 'Integration',
        apellido: 'Test',
        email: `test-${Date.now()}@integration.com`,
        password: 'password123',
        rol: Rol.ESTUDIANTE,
        emailVerificado: true,
        estudiante: {
          create: {
            carrera: 'Ingeniería de Pruebas',
            tipo: TipoEstudiante.ESTUDIANTE,
          },
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up the test data
    try {
      if (testUser) {
        await prisma.usuario.delete({ where: { id: testUser.id } });
      }
    } catch (e) {
      console.error('Error deleting test user', e);
    }

    try {
      if (testHabilidad) {
        await prisma.catalogoHabilidad.delete({ where: { id: testHabilidad.id } });
      }
    } catch (e) {
      console.error('Error deleting test skill', e);
    }

    await prisma.$disconnect();
  });

  it('should update a student profile with full nested data', async () => {
    const updateData: UpdateStudentProfileRequest = {
      // Top-level student fields
      telefono: '123456789',
      ubicacion: 'Test City, Test Country',
      linkedin: 'https://linkedin.com/in/integration-test',

      // 1-to-1 relation: PerfilProfesional
      perfilProfesional: {
        upsert: {
          create: {
            resumen: 'Este es un resumen profesional de prueba.',
            disponibilidad: DisponibilidadTipo.INMEDIATA,
            modalidad_trabajo: [ModalidadTrabajo.REMOTO, ModalidadTrabajo.HIBRIDO],
          },
          update: {
            resumen: 'Este es un resumen profesional de prueba.',
            disponibilidad: DisponibilidadTipo.INMEDIATA,
            modalidad_trabajo: [ModalidadTrabajo.REMOTO, ModalidadTrabajo.HIBRIDO],
          },
        },
      },

      // 1-to-N relation: Educacion
      educacion: {
        create: [
          {
            institucion: 'Universidad de Pruebas',
            tipo_institucion: TipoInstitucion.UNIVERSIDAD,
            titulo: 'Bachiller en Ciencias de la Computación',
            nivel_academico: NivelAcademico.PREGRADO,
            fecha_inicio: new Date('2020-01-15'),
            fecha_fin: new Date('2024-01-15'),
            en_curso: false,
            sistema_notas: SistemaNotas.VIGESIMAL,
          },
        ],
      },

      // 1-to-N relation: Experiencias
      experiencias: {
        create: [
          {
            cargo: 'Pasante de QA',
            empresa: 'Pruebas S.A.C',
            fecha_inicio: new Date('2023-06-01'),
            es_actual: true,
            modalidad: ModalidadTrabajo.REMOTO,
            descripcion: 'Automatización de pruebas para el perfil de usuario.',
            responsabilidades: ['Escribir tests', 'Reportar bugs'],
            logros: ['Mejora de cobertura en 50%'],
          },
        ],
      },

      // 1-to-N relation: Proyectos
      proyectos: {
        create: [
          {
            titulo: 'Proyecto de Prueba de Perfil',
            descripcion: 'Un proyecto para probar la actualización de perfiles.',
            tipo: TipoProyecto.DESARROLLO_SOFTWARE,
            fecha_inicio: new Date('2024-01-01'),
            estado: EstadoProyecto.EN_DESARROLLO,
            url_repositorio: 'https://github.com/test/test-project',
          },
        ],
      },
      
      // 1-to-N relation: HabilidadesNuevas
      habilidadesNuevas: {
        create: [
          {
            habilidad: { connect: { id: testHabilidad.id } },
            nivel: NivelDominio.AVANZADO,
          },
        ],
      },
    };

    // --- ACT ---
    const updatedProfile = await usersService.updateStudentProfile(testUser.id, updateData);

    // --- ASSERT ---
    expect(updatedProfile).toBeDefined();
    expect(updatedProfile.usuario.perfilCompleto).toBe(true);

    // Verify top-level fields
    expect(updatedProfile.telefono).toBe('123456789');
    expect(updatedProfile.ubicacion).toBe('Test City, Test Country');

    // Verify nested objects
    expect(updatedProfile.perfilProfesional).toBeDefined();
    expect(updatedProfile.perfilProfesional?.resumen).toBe('Este es un resumen profesional de prueba.');

    expect(updatedProfile.educacion).toHaveLength(1);
    expect(updatedProfile.educacion[0].institucion).toBe('Universidad de Pruebas');

    expect(updatedProfile.experiencias).toHaveLength(1);
    expect(updatedProfile.experiencias[0].cargo).toBe('Pasante de QA');

    expect(updatedProfile.proyectos).toHaveLength(1);
    expect(updatedProfile.proyectos[0].titulo).toBe('Proyecto de Prueba de Perfil');

    expect(updatedProfile.habilidadesNuevas).toHaveLength(1);
    expect(updatedProfile.habilidadesNuevas[0].habilidad.nombre).toBe(testHabilidad.nombre);
  });
});