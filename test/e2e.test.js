// Tests de integración end-to-end. Usan una base Mongo en memoria (mongodb-memory-server)
// o la indicada en TEST_MONGO_URL. Ejecutar con: npm test
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.MAIL_USER = '';
process.env.MAIL_PASS = '';

let memoryServer;
if (process.env.TEST_MONGO_URL) {
  process.env.MONGO_URL = process.env.TEST_MONGO_URL;
} else {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  process.env.MONGO_URL = memoryServer.getUri('ecommerce_test');
}

const { createApp } = await import('../src/app.js');
const { connectDB, disconnectDB } = await import('../src/config/db.config.js');
const { env } = await import('../src/config/env.config.js');
const { mailService } = await import('../src/services/mail.service.js');
const { userRepository } = await import('../src/repositories/index.js');
const { createHash } = await import('../src/utils/hash.js');

const app = createApp();
const admin = request.agent(app);
const user = request.agent(app);
const otherUser = request.agent(app);

const ADMIN = { email: 'admin@test.com', password: 'Admin1234' };
const USER = { first_name: 'Ana', last_name: 'Pérez', email: 'ana@test.com', age: 28, password: 'Secreta123' };
const OTHER = { first_name: 'Luis', last_name: 'Soto', email: 'luis@test.com', age: 35, password: 'Secreta456' };

let userCart;
let otherCart;
const products = {};

const extractToken = (email) => {
  const mail = mailService.lastMailTo(email);
  assert.ok(mail, `No se envió correo a ${email}`);
  const match = mail.text.match(/token=([^\s)]+)/);
  assert.ok(match, 'El correo no contiene el enlace con token');
  return decodeURIComponent(match[1]);
};

before(async () => {
  await connectDB(process.env.MONGO_URL);
  await mongoose.connection.db.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  await userRepository.create({
    first_name: 'Admin',
    last_name: 'Test',
    email: ADMIN.email,
    password: createHash(ADMIN.password),
    role: 'admin',
  });
});

after(async () => {
  await mongoose.connection.db.dropDatabase();
  await disconnectDB();
  if (memoryServer) await memoryServer.stop();
});

describe('Sesiones y DTO de /current', () => {
  it('registra usuarios con carrito propio y rol "user" aunque intenten enviar role=admin', async () => {
    const res = await user.post('/api/sessions/register').send({ ...USER, role: 'admin' });
    assert.equal(res.status, 201);
    assert.equal(res.body.payload.role, 'user');
    assert.ok(res.body.payload.cart);
    assert.equal(res.body.payload.password, undefined);
    userCart = res.body.payload.cart;

    const res2 = await otherUser.post('/api/sessions/register').send(OTHER);
    assert.equal(res2.status, 201);
    otherCart = res2.body.payload.cart;
  });

  it('rechaza emails duplicados y campos faltantes', async () => {
    const dup = await request(app).post('/api/sessions/register').send(USER);
    assert.equal(dup.status, 409);
    const missing = await request(app).post('/api/sessions/register').send({ email: 'x@test.com', password: 'Secreta123' });
    assert.equal(missing.status, 400);
  });

  it('rechaza credenciales inválidas', async () => {
    const res = await request(app).post('/api/sessions/login').send({ email: USER.email, password: 'incorrecta' });
    assert.equal(res.status, 401);
  });

  it('login setea cookie httpOnly y /current devuelve un DTO sin datos sensibles', async () => {
    const login = await user.post('/api/sessions/login').send({ email: USER.email, password: USER.password });
    assert.equal(login.status, 200);
    const cookie = login.headers['set-cookie'].join(';');
    assert.match(cookie, /HttpOnly/i);

    const res = await user.get('/api/sessions/current');
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.body.payload).sort(), [
      'age', 'cart', 'email', 'first_name', 'full_name', 'id', 'last_name', 'role',
    ]);
    assert.equal(res.body.payload.password, undefined);
    assert.equal(res.body.payload.email, USER.email);

    await admin.post('/api/sessions/login').send(ADMIN).expect(200);
    await otherUser.post('/api/sessions/login').send({ email: OTHER.email, password: OTHER.password }).expect(200);
  });

  it('/current sin sesión responde 401', async () => {
    const res = await request(app).get('/api/sessions/current');
    assert.equal(res.status, 401);
  });

  it('/current también acepta Bearer token', async () => {
    const dbUser = await userRepository.getByEmail(USER.email);
    const token = jwt.sign({ sub: String(dbUser._id), role: 'user' }, env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).get('/api/sessions/current').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.payload.email, USER.email);
  });
});

describe('Autorización de productos (solo admin crea, actualiza y elimina)', () => {
  const base = { description: 'desc', category: 'cafe' };

  it('usuario anónimo recibe 401 y usuario "user" recibe 403 al crear', async () => {
    const body = { ...base, title: 'X', code: 'X-1', price: 10, stock: 1 };
    assert.equal((await request(app).post('/api/products').send(body)).status, 401);
    assert.equal((await user.post('/api/products').send(body)).status, 403);
  });

  it('admin crea productos', async () => {
    const defs = [
      ['a', { title: 'Café A', code: 'A-1', price: 100, stock: 10 }],
      ['b', { title: 'Café B', code: 'B-1', price: 50.5, stock: 1 }],
      ['c', { title: 'Café C', code: 'C-1', price: 20, stock: 0 }],
      ['tmp', { title: 'Temporal', code: 'T-1', price: 1, stock: 1 }],
    ];
    for (const [key, def] of defs) {
      const res = await admin.post('/api/products').send({ ...base, ...def });
      assert.equal(res.status, 201, JSON.stringify(res.body));
      products[key] = res.body.payload.id;
    }
  });

  it('admin no puede duplicar el código y valida campos', async () => {
    const dup = await admin.post('/api/products').send({ ...base, title: 'Dup', code: 'A-1', price: 1, stock: 1 });
    assert.equal(dup.status, 409);
    const invalid = await admin.post('/api/products').send({ title: 'Sin datos' });
    assert.equal(invalid.status, 400);
  });

  it('usuario no puede actualizar ni eliminar; admin sí', async () => {
    assert.equal((await user.put(`/api/products/${products.tmp}`).send({ price: 2 })).status, 403);
    assert.equal((await user.delete(`/api/products/${products.tmp}`)).status, 403);
    const upd = await admin.put(`/api/products/${products.tmp}`).send({ price: 2 });
    assert.equal(upd.status, 200);
    assert.equal(upd.body.payload.price, 2);
    assert.equal((await admin.delete(`/api/products/${products.tmp}`)).status, 200);
    assert.equal((await request(app).get(`/api/products/${products.tmp}`)).status, 404);
  });

  it('el catálogo es público y paginado', async () => {
    const res = await request(app).get('/api/products?limit=2&sort=asc');
    assert.equal(res.status, 200);
    assert.equal(res.body.payload.length, 2);
    assert.equal(res.body.payload[0].price, 20);
    assert.equal(res.body.hasNextPage, true);
    assert.ok(res.body.nextLink.includes('page=2'));
  });
});

describe('Carrito (solo el usuario agrega productos a su carrito)', () => {
  it('admin no puede agregar productos a un carrito', async () => {
    const res = await admin.post(`/api/carts/${userCart}/product/${products.a}`);
    assert.equal(res.status, 403);
  });

  it('un usuario no puede agregar productos al carrito de otro', async () => {
    const res = await otherUser.post(`/api/carts/${userCart}/product/${products.a}`);
    assert.equal(res.status, 403);
  });

  it('el usuario agrega productos a su propio carrito', async () => {
    await user.post(`/api/carts/${userCart}/product/${products.a}`).send({ quantity: 2 }).expect(200);
    await user.post(`/api/carts/${userCart}/product/${products.a}`).expect(200); // suma 1 → 3
    await user.post(`/api/carts/${userCart}/products/${products.b}`).send({ quantity: 3 }).expect(200);
    const res = await user.post(`/api/carts/${userCart}/product/${products.c}`).send({ quantity: 1 });
    assert.equal(res.status, 200);
    const items = Object.fromEntries(res.body.payload.products.map((i) => [i.product.id, i.quantity]));
    assert.equal(items[products.a], 3);
    assert.equal(items[products.b], 3);
    assert.equal(items[products.c], 1);
  });

  it('valida cantidades y productos inexistentes', async () => {
    assert.equal((await user.post(`/api/carts/${userCart}/product/${products.a}`).send({ quantity: -1 })).status, 400);
    assert.equal((await user.post(`/api/carts/${userCart}/product/${products.tmp}`)).status, 404);
    assert.equal((await user.post(`/api/carts/${userCart}/product/no-es-id`)).status, 400);
  });

  it('dueño y admin pueden ver el carrito; otro usuario no', async () => {
    assert.equal((await user.get(`/api/carts/${userCart}`)).status, 200);
    assert.equal((await admin.get(`/api/carts/${userCart}`)).status, 200);
    assert.equal((await otherUser.get(`/api/carts/${userCart}`)).status, 403);
  });
});

describe('Compra y Ticket', () => {
  it('admin no puede comprar', async () => {
    assert.equal((await admin.post(`/api/carts/${userCart}/purchase`)).status, 403);
  });

  it('compra incompleta: genera ticket con lo disponible y deja el resto en el carrito', async () => {
    const res = await user.post(`/api/carts/${userCart}/purchase`);
    assert.equal(res.status, 201, JSON.stringify(res.body));
    const { ticket, notProcessed, notProcessedIds, status } = res.body.payload;
    assert.equal(status, 'incomplete');

    // Ticket con todos los campos requeridos
    assert.ok(ticket.code);
    assert.ok(ticket.purchase_datetime);
    assert.equal(ticket.purchaser, USER.email);
    assert.equal(ticket.amount, 300); // 3 x 100 (A). B y C sin stock suficiente
    assert.equal(ticket.products.length, 1);

    assert.deepEqual(new Set(notProcessedIds), new Set([products.b, products.c]));
    assert.equal(notProcessed.length, 2);

    const stockA = await request(app).get(`/api/products/${products.a}`);
    assert.equal(stockA.body.payload.stock, 7);

    const cart = await user.get(`/api/carts/${userCart}`);
    const ids = cart.body.payload.products.map((i) => i.product.id);
    assert.deepEqual(new Set(ids), new Set([products.b, products.c]));
  });

  it('sin stock para ningún producto responde 409 y no genera ticket', async () => {
    const res = await user.post(`/api/carts/${userCart}/purchase`);
    assert.equal(res.status, 409);
    assert.equal(res.body.details.notProcessed.length, 2);
  });

  it('compra completa tras reponer stock y ajustar cantidades', async () => {
    await admin.put(`/api/products/${products.c}`).send({ stock: 5 }).expect(200);
    await user.put(`/api/carts/${userCart}/products/${products.b}`).send({ quantity: 1 }).expect(200);
    const res = await user.post(`/api/carts/${userCart}/purchase`);
    assert.equal(res.status, 201);
    assert.equal(res.body.payload.status, 'complete');
    assert.equal(res.body.payload.ticket.amount, 70.5); // 50.5 + 20
    assert.equal(res.body.payload.notProcessed.length, 0);

    const cart = await user.get(`/api/carts/${userCart}`);
    assert.equal(cart.body.payload.products.length, 0);
  });

  it('carrito vacío no se puede comprar', async () => {
    assert.equal((await user.post(`/api/carts/${userCart}/purchase`)).status, 400);
  });

  it('el usuario ve sus tickets; admin ve todos; otro usuario no ve tickets ajenos', async () => {
    const mine = await user.get('/api/tickets/mine');
    assert.equal(mine.status, 200);
    assert.equal(mine.body.payload.length, 2);
    const all = await admin.get('/api/tickets');
    assert.equal(all.status, 200);
    assert.equal((await user.get('/api/tickets')).status, 403);
    const tid = mine.body.payload[0].id;
    assert.equal((await otherUser.get(`/api/tickets/${tid}`)).status, 403);
    assert.equal((await user.get(`/api/tickets/${tid}`)).status, 200);
  });

  it('envía correo de confirmación de compra', async () => {
    const mail = mailService.lastMailTo(USER.email);
    assert.match(mail.subject, /Confirmación de compra/);
  });
});

describe('Recuperación de contraseña', () => {
  it('responde lo mismo para emails inexistentes (sin enumeración)', async () => {
    const res = await request(app).post('/api/sessions/forgot-password').send({ email: 'nadie@test.com' });
    assert.equal(res.status, 200);
    assert.equal(mailService.lastMailTo('nadie@test.com'), null);
  });

  it('envía un correo con botón y enlace que expira en 1 hora', async () => {
    const res = await request(app).post('/api/sessions/forgot-password').send({ email: USER.email });
    assert.equal(res.status, 200);
    const mail = mailService.lastMailTo(USER.email);
    assert.match(mail.html, /<a href="http:\/\/[^"]+\/reset-password\?token=/);
    assert.match(mail.html, /Restablecer contraseña/);
    const token = extractToken(USER.email);
    const decoded = jwt.decode(token);
    assert.equal(decoded.exp - decoded.iat, 3600);
  });

  it('el enlace abre la vista de restablecimiento y el token se valida', async () => {
    const token = extractToken(USER.email);
    const page = await request(app).get(`/reset-password?token=${encodeURIComponent(token)}`);
    assert.equal(page.status, 200);
    assert.match(page.text, /Restablecer contraseña/);
    const valid = await request(app).get(`/api/sessions/reset-password/validate?token=${encodeURIComponent(token)}`);
    assert.equal(valid.status, 200);
  });

  it('no permite reutilizar la misma contraseña', async () => {
    const token = extractToken(USER.email);
    const res = await request(app).post('/api/sessions/reset-password').send({ token, password: USER.password });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /no puede ser igual/);
  });

  it('rechaza un enlace expirado', async () => {
    const dbUser = await userRepository.getByEmail(USER.email);
    const expired = jwt.sign(
      { sub: String(dbUser._id), purpose: 'password-reset', fp: 'x', exp: Math.floor(Date.now() / 1000) - 10 },
      env.RESET_PASSWORD_SECRET,
    );
    const res = await request(app).post('/api/sessions/reset-password').send({ token: expired, password: 'NuevaClave1' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /expiró/);
  });

  it('cambia la contraseña con un enlace válido y el enlace queda inutilizable', async () => {
    const token = extractToken(USER.email);
    const res = await request(app).post('/api/sessions/reset-password').send({ token, password: 'NuevaClave1' });
    assert.equal(res.status, 200);

    const reuse = await request(app).post('/api/sessions/reset-password').send({ token, password: 'OtraClave22' });
    assert.equal(reuse.status, 400);

    assert.equal(
      (await request(app).post('/api/sessions/login').send({ email: USER.email, password: USER.password })).status,
      401,
    );
    assert.equal(
      (await request(app).post('/api/sessions/login').send({ email: USER.email, password: 'NuevaClave1' })).status,
      200,
    );
  });
});

describe('Gestión de usuarios (solo admin)', () => {
  it('user recibe 403 y admin lista usuarios sin passwords', async () => {
    assert.equal((await user.get('/api/users')).status, 403);
    const res = await admin.get('/api/users');
    assert.equal(res.status, 200);
    assert.ok(res.body.payload.every((u) => u.password === undefined));
  });

  it('logout invalida la sesión en el cliente', async () => {
    await user.post('/api/sessions/logout').expect(200);
    assert.equal((await user.get('/api/sessions/current')).status, 401);
  });
});
