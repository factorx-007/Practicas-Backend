import { PrismaClient, CategoriaBeneficio } from '@prisma/client';

const prisma = new PrismaClient();

const beneficios = [
  // SALUD
  { nombre: 'Seguro de Salud', categoria: CategoriaBeneficio.SALUD, icono: 'Heart' },
  { nombre: 'Seguro Dental', categoria: CategoriaBeneficio.SALUD, icono: 'Smile' },
  { nombre: 'Seguro de Vida', categoria: CategoriaBeneficio.SALUD, icono: 'Shield' },
  { nombre: 'Seguro Oftalmológico', categoria: CategoriaBeneficio.SALUD, icono: 'Eye' },
  
  // FINANCIERO
  { nombre: 'Bonos por Desempeño', categoria: CategoriaBeneficio.FINANCIERO, icono: 'DollarSign' },
  { nombre: 'Aguinaldo', categoria: CategoriaBeneficio.FINANCIERO, icono: 'Gift' },
  { nombre: 'Participación de Utilidades', categoria: CategoriaBeneficio.FINANCIERO, icono: 'TrendingUp' },
  { nombre: 'Préstamos sin Interés', categoria: CategoriaBeneficio.FINANCIERO, icono: 'CreditCard' },
  
  // DESARROLLO_PROFESIONAL
  { nombre: 'Capacitaciones', categoria: CategoriaBeneficio.DESARROLLO_PROFESIONAL, icono: 'BookOpen' },
  { nombre: 'Cursos Online', categoria: CategoriaBeneficio.DESARROLLO_PROFESIONAL, icono: 'Monitor' },
  { nombre: 'Certificaciones', categoria: CategoriaBeneficio.DESARROLLO_PROFESIONAL, icono: 'Award' },
  { nombre: 'Conferencias', categoria: CategoriaBeneficio.DESARROLLO_PROFESIONAL, icono: 'Users' },
  
  // FLEXIBILIDAD
  { nombre: 'Horario Flexible', categoria: CategoriaBeneficio.FLEXIBILIDAD, icono: 'Clock' },
  { nombre: 'Trabajo Remoto', categoria: CategoriaBeneficio.FLEXIBILIDAD, icono: 'Home' },
  { nombre: 'Días de Home Office', categoria: CategoriaBeneficio.FLEXIBILIDAD, icono: 'Laptop' },
  { nombre: 'Viernes Cortos', categoria: CategoriaBeneficio.FLEXIBILIDAD, icono: 'Calendar' },
  
  // BIENESTAR
  { nombre: 'Gimnasio', categoria: CategoriaBeneficio.BIENESTAR, icono: 'Activity' },
  { nombre: 'Días de Descanso Extra', categoria: CategoriaBeneficio.BIENESTAR, icono: 'Sun' },
  { nombre: 'Masajes', categoria: CategoriaBeneficio.BIENESTAR, icono: 'Heart' },
  { nombre: 'Yoga', categoria: CategoriaBeneficio.BIENESTAR, icono: 'User' },
  
  // TRANSPORTE
  { nombre: 'Transporte', categoria: CategoriaBeneficio.TRANSPORTE, icono: 'Car' },
  { nombre: 'Estacionamiento', categoria: CategoriaBeneficio.TRANSPORTE, icono: 'ParkingCircle' },
  { nombre: 'Subsidio de Combustible', categoria: CategoriaBeneficio.TRANSPORTE, icono: 'Fuel' },
  
  // ALIMENTACION
  { nombre: 'Almuerzo', categoria: CategoriaBeneficio.ALIMENTACION, icono: 'Coffee' },
  { nombre: 'Snacks', categoria: CategoriaBeneficio.ALIMENTACION, icono: 'Cookie' },
  { nombre: 'Vales de Alimentación', categoria: CategoriaBeneficio.ALIMENTACION, icono: 'ShoppingBag' },
];

async function seedBeneficios() {
  console.log('🌱 Seeding beneficios...');

  for (const beneficio of beneficios) {
    await prisma.catalogoBeneficio.upsert({
      where: { nombre: beneficio.nombre },
      create: beneficio,
      update: beneficio,
    });
  }

  console.log(`✅ ${beneficios.length} beneficios seeded`);
}

seedBeneficios()
  .catch((e) => {
    console.error('❌ Error seeding beneficios:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
