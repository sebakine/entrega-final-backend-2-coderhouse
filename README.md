# Entrega Final · Backend 2 · Coderhouse

Servidor de ecommerce en **Node.js + Express + MongoDB** con arquitectura en capas, patrones **DAO / Repository / DTO**, autenticación con **Passport + JWT**, autorización por **roles**, **recuperación de contraseña por mail** y **lógica de compra con Tickets**.

---

## Índice

1. [Instalación y ejecución](#instalación-y-ejecución)
2. [Variables de entorno](#variables-de-entorno)
3. [Arquitectura](#arquitectura)
4. [Cobertura de la consigna](#cobertura-de-la-consigna)
5. [Roles y permisos](#roles-y-permisos)
6. [Endpoints](#endpoints)
7. [Flujos principales](#flujos-principales)
8. [Tests](#tests)

---

## Instalación y ejecución

Requisitos: **Node.js 18.18+** y **MongoDB** (local o Atlas).

```bash
npm install
npm run seed     # crea el usuario admin y productos de ejemplo
npm run dev      # modo desarrollo (nodemon)
# o
npm start
```

El servidor queda disponible en `http://localhost:8080`.

| Script          | Descripción                                                |
| --------------- | ---------------------------------------------------------- |
| `npm start`     | Inicia el servidor                                         |
| `npm run dev`   | Inicia el servidor con recarga automática (nodemon)        |
| `npm run seed`  | Crea el admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) y productos |
| `npm test`      | Ejecuta los tests de integración (Mongo en memoria)        |

---

## Variables de entorno

El archivo `.env` se incluye en el repositorio, tal como pide la consigna. `.env.example` sirve de plantilla.

| Variable                    | Descripción                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| `PORT`, `BASE_URL`          | Puerto y URL pública (se usa para armar el enlace del correo)        |
| `PERSISTENCE`               | Implementación de DAO a usar desde la factory (`MONGO`)              |
| `MONGO_URL`                 | Cadena de conexión a MongoDB                                         |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Firma y duración del token de sesión                              |
| `COOKIE_NAME`, `COOKIE_SECRET` | Cookie firmada `httpOnly` que transporta el JWT                  |
| `RESET_PASSWORD_SECRET`     | Secreto exclusivo de los enlaces de recuperación                     |
| `RESET_PASSWORD_EXPIRES_IN` | Vigencia del enlace de recuperación (**1h**)                         |
| `MAIL_SERVICE`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | Configuración de Nodemailer                |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Credenciales del admin creado por `npm run seed`                 |

### Mailing

- **Con `MAIL_USER` y `MAIL_PASS`** (por ejemplo, Gmail con una *contraseña de aplicación*), los correos se envían por SMTP real.
- **Sin credenciales**, el servidor usa un transporte de desarrollo: el correo no sale y el enlace de recuperación se imprime en la consola. Así el flujo completo puede probarse sin configurar SMTP.

---

## Arquitectura

```
src/
├── app.js                   # Configuración de Express (middlewares, rutas, errores)
├── server.js                # Arranque: conexión a DB + listen + apagado ordenado
├── config/
│   ├── env.config.js        # Lectura y validación de variables de entorno
│   ├── db.config.js         # Conexión a MongoDB
│   └── passport.config.js   # Estrategias: register, login y current (JWT)
├── constants/roles.js       # Roles: admin, user
├── dao/
│   ├── factory.js           # Factory: elige la implementación según PERSISTENCE
│   └── mongo/
│       ├── models/          # Esquemas Mongoose: user, product, cart, ticket
│       ├── base.mongo.dao.js
│       └── *.mongo.dao.js   # Acceso a datos (única capa que conoce Mongoose)
├── dto/                     # DTOs de entrada (whitelist) y de salida (sin datos sensibles)
├── repositories/            # Patrón Repository sobre los DAOs
├── services/                # Lógica de negocio (auth, productos, carrito/compra, tickets, mail)
├── controllers/             # Adaptan HTTP ↔ services
├── routes/                  # Definición de endpoints + middlewares de autorización
├── middlewares/             # passportCall, authorization, cartOwnership, errores
├── templates/emails.js      # Plantillas HTML de correo (botón de restablecimiento)
└── utils/                   # hash (bcrypt), jwt, AppError, asyncHandler
public/                      # Vistas de "olvidé mi contraseña" y "restablecer contraseña"
scripts/seed.js              # Seed de admin y productos
test/e2e.test.js             # Tests de integración
```

**Flujo de una petición**

```
Router → [passportCall('current') → authorization(rol) → cartOwnership] → Controller → Service → Repository → DAO → MongoDB
                                                                                  ↓
                                                                                 DTO → respuesta
```

- **DAO**: encapsula Mongoose y devuelve objetos planos (`lean`). Incluye operaciones atómicas (`$inc` condicionado por stock, `$push`/`$pull` en el carrito) para evitar condiciones de carrera y consultas redundantes.
- **Factory**: `src/dao/factory.js` instancia los DAOs según `PERSISTENCE`, así se puede cambiar la persistencia sin tocar el resto del código.
- **Repository**: interfaz que consumen los services. Se inyecta el DAO en el constructor (`src/repositories/index.js`). Los services **nunca** importan modelos ni DAOs.
- **DTO**: `CurrentUserDTO`, `CreateUserDTO`, `UpdateUserDTO`, `ProductInputDTO`, `ProductDTO`, `CartDTO`, `TicketDTO`. Los de entrada funcionan como *whitelist* (por ejemplo, impiden auto-asignarse `role: admin` al registrarse).

---

## Cobertura de la consigna

| Requisito | Implementación |
| --- | --- |
| **Patrón Repository con DAO** | `src/repositories/*` envuelven `src/dao/mongo/*`; la inyección se hace en `src/repositories/index.js` a partir de la factory. |
| **`/current` con DTO** | `GET /api/sessions/current` responde `CurrentUserDTO` (`id, first_name, last_name, full_name, email, age, role, cart`). La estrategia `current` ya deja en `req.user` el DTO, así ningún dato sensible circula por la request. |
| **Recuperación de contraseña** | `POST /api/sessions/forgot-password` envía un correo HTML con botón **"Restablecer contraseña"**. El enlace es un JWT firmado con un secreto propio que **expira en 1 hora** y queda ligado al hash actual de la contraseña (**uso único**). `POST /api/sessions/reset-password` **rechaza la misma contraseña anterior** (`bcrypt.compare`). |
| **Middleware de autorización** | `authorization(...roles)` trabaja junto a `passportCall('current')`. Solo **admin** crea/actualiza/elimina productos; solo **user** agrega productos a **su** carrito (`cartOwnership`). |
| **Arquitectura profesional** | Capas separadas, factory de DAOs, variables de entorno validadas, manejo centralizado de errores (`AppError`), mailing con Nodemailer y plantillas HTML. |
| **Lógica de compra** | `POST /api/carts/:cid/purchase` (solo user, dueño del carrito): verifica y descuenta stock de forma atómica, genera **Ticket** (`code`, `purchase_datetime`, `amount`, `purchaser`), maneja compra **completa** e **incompleta** (lo sin stock queda en el carrito y se informan sus ids) y revierte el stock si falla la creación del ticket. Envía correo de confirmación. |

---

## Roles y permisos

| Acción | Anónimo | `user` | `admin` |
| --- | :---: | :---: | :---: |
| Ver catálogo de productos | ✅ | ✅ | ✅ |
| Crear / actualizar / eliminar productos | ❌ 401 | ❌ 403 | ✅ |
| Agregar / modificar productos de **su** carrito | ❌ 401 | ✅ | ❌ 403 |
| Operar el carrito de **otro** usuario | ❌ 401 | ❌ 403 | ❌ 403 |
| Ver un carrito | ❌ 401 | solo el propio | ✅ (lectura) |
| Finalizar compra | ❌ 401 | solo su carrito | ❌ 403 |
| Ver tickets | ❌ 401 | solo los propios | ✅ todos |
| Gestionar usuarios | ❌ 401 | ❌ 403 | ✅ |

- El registro público **siempre** crea usuarios con rol `user` y un carrito propio.
- El admin se crea con `npm run seed`. Un admin no puede cambiar su propio rol ni eliminarse a sí mismo.

---

## Endpoints

Base: `http://localhost:8080/api`

### Sesiones · `/api/sessions`

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/register` | Público | Registro (`first_name, last_name, email, age, password`) |
| POST | `/login` | Público | Login. Setea cookie `httpOnly` firmada con el JWT |
| GET | `/current` | Autenticado | Usuario actual como **DTO** |
| POST | `/logout` | Público | Elimina la cookie de sesión |
| POST | `/forgot-password` | Público | Envía correo de recuperación (`email`) |
| GET | `/reset-password/validate?token=` | Público | Valida el enlace antes de mostrar el formulario |
| POST | `/reset-password` | Público | Cambia la contraseña (`token, password, confirmPassword`) |

> La estrategia `current` acepta el JWT desde la cookie o desde el header `Authorization: Bearer <token>`.

### Productos · `/api/products`

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/?limit=&page=&sort=asc\|desc&query=` | Público |
| GET | `/:pid` | Público |
| POST | `/` | **admin** |
| PUT | `/:pid` | **admin** |
| DELETE | `/:pid` | **admin** |

`query` acepta `category:<nombre>`, `status:true|false`, `available` o directamente un nombre de categoría.

### Carritos · `/api/carts`

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/:cid` | dueño o admin |
| POST | `/:cid/product/:pid` (alias `/:cid/products/:pid`) | **user** dueño · body opcional `{ "quantity": n }` |
| PUT | `/:cid/products/:pid` | **user** dueño · `{ "quantity": n }` |
| DELETE | `/:cid/products/:pid` | **user** dueño |
| PUT | `/:cid` | **user** dueño · `[{ "product": id, "quantity": n }]` |
| DELETE | `/:cid` | **user** dueño (vacía el carrito) |
| POST | `/:cid/purchase` | **user** dueño · genera el ticket |

### Tickets · `/api/tickets`

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/` | **admin** |
| GET | `/mine` | **user** |
| GET | `/:tid` | admin o comprador |

### Usuarios · `/api/users` (solo admin)

`GET /`, `GET /:uid`, `PUT /:uid` (`first_name, last_name, age, role`), `DELETE /:uid`.

---

## Flujos principales

### Compra

```http
POST /api/carts/:cid/purchase
```

Respuesta de una compra **incompleta** (`201`):

```json
{
  "status": "success",
  "message": "Compra realizada parcialmente: algunos productos no tenían stock suficiente y permanecen en el carrito",
  "payload": {
    "status": "incomplete",
    "ticket": {
      "id": "…",
      "code": "TCK-1A2B3C4D-M1X2Y3",
      "purchase_datetime": "2026-09-23T21:30:00.000Z",
      "amount": 300,
      "purchaser": "ana@test.com",
      "products": [{ "product": "…", "title": "Café A", "price": 100, "quantity": 3, "subtotal": 300 }]
    },
    "notProcessed": [{ "product": "…", "title": "Café B", "requested": 3, "available": 1 }],
    "notProcessedIds": ["…"]
  }
}
```

- Si **ningún** producto tiene stock suficiente responde `409` sin generar ticket.
- Si el carrito está vacío responde `400`.

### Recuperación de contraseña

1. `POST /api/sessions/forgot-password` con `{ "email": "…" }` (o desde `http://localhost:8080/forgot-password`).
2. Llega un correo con el botón **Restablecer contraseña** → abre `http://localhost:8080/reset-password?token=…`.
3. La vista valida el enlace y permite ingresar la nueva contraseña.
4. Reglas: el enlace **expira a la hora**, es de **uso único** y la nueva contraseña **no puede ser igual a la anterior**.

---

## Tests

```bash
npm test
```

Tests de integración con `node:test` + `supertest` sobre una base MongoDB en memoria (`mongodb-memory-server`). Cubren registro, login, DTO de `/current`, autorización por rol en productos, carrito y tickets, compra completa e incompleta, reversión de estado del carrito y el flujo completo de recuperación de contraseña (expiración, uso único y contraseña repetida).

Para usar una base propia en lugar de la de memoria: `TEST_MONGO_URL=mongodb://… npm test`.

---

**Autor:** Sebastián Felipe Muñoz Rivera
