'''
import { PrismaClient, NivelDominio } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para migrar datos de los campos legacy (JSON y arrays) a las nuevas tablas de la estructura híbrida.
 * Es idempotente: no duplicará datos si se ejecuta varias veces.
 */
async function main() {
  console.log('Iniciando migración de datos a la estructura híbrida...');

  // 1. Migrar Habilidades
  await migrateHabilidades();

  // 2. Migrar Experiencias
  await migrateExperiencias();

  console.log('Migración de datos completada.');
}

async function migrateHabilidades() {
  console.log('--- Migrando Habilidades ---');
  const estudiantes = await prisma.estudiante.findMany({
    where: {
      habilidades: {
        isEmpty: false,
      },
    },
    select: {
      id: true,
      habilidades: true,
    },
  });

  if (estudiantes.length === 0) {
    console.log('No hay estudiantes con habilidades en el campo legacy para migrar.');
    return;
  }

  console.log(`Encontrados ${estudiantes.length} estudiantes para migrar habilidades.`);

  // Crear o encontrar las habilidades en el catálogo primero
  const todasHabilidades = [...new Set(estudiantes.flatMap(e => e.habilidades))];
  console.log('Asegurando que todas las habilidades existan en el catálogo...');
  for (const nombreHabilidad of todasHabilidades) {
    await prisma.catalogoHabilidad.upsert({
      where: { nombre: nombreHabilidad },
      update: {},
      create: {
        nombre: nombreHabilidad,
        categoria: 'OTRO', // Categoría por defecto
        tipo: 'TECNICA', // Tipo por defecto
      },
    });
  }
  console.log('Catálogo de habilidades actualizado.');

  const habilidadesConId = await prisma.catalogoHabilidad.findMany({
    where: {
      nombre: { in: todasHabilidades },
    },
  });
  const mapaHabilidades = new Map(habilidadesConId.map(h => [h.nombre, h.id]));

  // Migrar las habilidades de cada estudiante
  for (const estudiante of estudiantes) {
    const habilidadesExistentes = await prisma.estudianteHabilidad.count({
        where: { estudianteId: estudiante.id }
    });

    if (habilidadesExistentes > 0) {
        console.log(`Estudiante ${estudiante.id} ya tiene habilidades en la nueva tabla. Omitiendo.`);
        continue;
    }

    const habilidadesParaCrear = estudiante.habilidades
      .map(nombre => ({
        estudianteId: estudiante.id,
        habilidad_id: mapaHabilidades.get(nombre)!,
        nivel: NivelDominio.INTERMEDIO, // Nivel por defecto
      }))
      .filter(h => h.habilidad_id); // Filtrar por si alguna habilidad no se encontró

    if (habilidadesParaCrear.length > 0) {
      await prisma.estudianteHabilidad.createMany({
        data: habilidadesParaCrear,
        skipDuplicates: true,
      });
      console.log(`Migradas ${habilidadesParaCrear.length} habilidades para el estudiante ${estudiante.id}.`);
    }
  }
}

async function migrateExperiencias() {
    console.log('
--- Migrando Experiencias ---');
    const estudiantes = await prisma.estudiante.findMany({
        where: {
            experiencia: {
                not: 'null'
            }
        },
        select: {
            id: true,
            experiencia: true,
        }
    });

    if (estudiantes.length === 0) {
        console.log('No hay estudiantes con experiencias en el campo legacy para migrar.');
        return;
    }

    console.log(`Encontrados ${estudiantes.length} estudiantes para migrar experiencias.`);

    for (const estudiante of estudiantes) {
        const experienciasExistentes = await prisma.experienciaLaboral.count({
            where: { estudianteId: estudiante.id }
        });

        if (experienciasExistentes > 0) {
            console.log(`Estudiante ${estudiante.id} ya tiene experiencias en la nueva tabla. Omitiendo.`);
            continue;
        }

        const experienciasJson = estudiante.experiencia as any[];
        if (!Array.isArray(experienciasJson)) continue;

        for (const exp of experienciasJson) {
            // Validar datos básicos de la experiencia
            if (!exp.puesto || !exp.empresa || !exp.fechaInicio) {
                console.warn(`Omitiendo experiencia inválida para estudiante ${estudiante.id}:`, exp);
                continue;
            }

            await prisma.experienciaLaboral.create({
                data: {
                    estudianteId: estudiante.id,
                    cargo: exp.puesto,
                    empresa: exp.empresa,
                    fecha_inicio: new Date(exp.fechaInicio),
                    fecha_fin: exp.fechaFin ? new Date(exp.fechaFin) : null,
                    es_actual: exp.esTrabajoActual ?? false,
                    descripcion: exp.descripcion ?? null,
                    responsabilidades: exp.responsabilidades ?? [],
                    logros: exp.logros ?? [],
                    modalidad: 'PRESENCIAL', // Modalidad por defecto
                }
            });
        }
        console.log(`Migradas ${experienciasJson.length} experiencias para el estudiante ${estudiante.id}.`);
    }
}


main()
  .catch((e) => {
    console.error('Error durante la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
''