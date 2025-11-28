import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary con variables de entorno siguiendo mejores prácticas oficiales
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Asegurar URLs HTTPS siempre
  timeout: 60000, // 60 segundos timeout para uploads grandes
});

// Verificar configuración al importar
const isConfigured = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  return !!(cloud_name && api_key && api_secret);
};

if (!isConfigured()) {
  console.warn('⚠️  Cloudinary no está configurado correctamente. Verifica las variables de entorno:');
  console.warn('   - CLOUDINARY_CLOUD_NAME');
  console.warn('   - CLOUDINARY_API_KEY');
  console.warn('   - CLOUDINARY_API_SECRET');
} else {
  console.log('☁️  Cloudinary configurado correctamente');
}

// Helper para crear upload stream wrapped en Promise (patrón oficial recomendado)
export const streamUpload = (buffer: Buffer, options: any = {}): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        timeout: 60000,
        ...options
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

export default cloudinary;
export { isConfigured };