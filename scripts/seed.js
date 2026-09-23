// Crea el usuario administrador (desde ADMIN_EMAIL / ADMIN_PASSWORD) y productos de ejemplo.
// Uso: npm run seed
import { connectDB, disconnectDB } from '../src/config/db.config.js';
import { env } from '../src/config/env.config.js';
import { ROLES } from '../src/constants/roles.js';
import { productRepository, userRepository } from '../src/repositories/index.js';
import { createHash } from '../src/utils/hash.js';

const products = [
  { title: 'Café Etiopía Yirgacheffe 250g', description: 'Lavado, notas florales y cítricas', code: 'CAF-ETH-250', price: 12990, stock: 25, category: 'cafe' },
  { title: 'Café Colombia Huila 250g', description: 'Lavado, notas a panela y frutos rojos', code: 'CAF-COL-250', price: 10990, stock: 30, category: 'cafe' },
  { title: 'Café Brasil Cerrado 1kg', description: 'Natural, notas a chocolate y nuez', code: 'CAF-BRA-1K', price: 29990, stock: 10, category: 'cafe' },
  { title: 'Prensa francesa 600ml', description: 'Vidrio borosilicato y acero inoxidable', code: 'ACC-PRE-600', price: 18990, stock: 8, category: 'accesorios' },
  { title: 'Molinillo manual de muelas cónicas', description: 'Ajuste de molienda de 40 pasos', code: 'ACC-MOL-01', price: 45990, stock: 5, category: 'accesorios' },
  { title: 'Filtros de papel V60 x100', description: 'Filtros blanqueados tamaño 02', code: 'ACC-FIL-100', price: 5990, stock: 2, category: 'accesorios' },
];

const run = async () => {
  await connectDB();

  const existingAdmin = await userRepository.getByEmail(env.ADMIN_EMAIL);
  if (existingAdmin) {
    console.log(`[seed] El admin ${env.ADMIN_EMAIL} ya existe`);
  } else {
    await userRepository.create({
      first_name: 'Admin',
      last_name: 'Coder',
      email: env.ADMIN_EMAIL,
      age: 30,
      password: createHash(env.ADMIN_PASSWORD),
      role: ROLES.ADMIN,
    });
    console.log(`[seed] Admin creado: ${env.ADMIN_EMAIL}`);
  }

  let created = 0;
  for (const product of products) {
    if (!(await productRepository.getByCode(product.code))) {
      await productRepository.create(product);
      created += 1;
    }
  }
  console.log(`[seed] Productos creados: ${created} (ya existentes: ${products.length - created})`);

  await disconnectDB();
};

run().catch(async (error) => {
  console.error('[seed] Error:', error.message);
  await disconnectDB();
  process.exit(1);
});
