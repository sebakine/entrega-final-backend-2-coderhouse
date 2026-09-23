// DTO de salida para /api/sessions/current y respuestas de usuario.
// Solo expone información necesaria y no sensible: nunca password, timestamps internos ni tokens.
export class CurrentUserDTO {
  constructor(user) {
    this.id = String(user._id ?? user.id);
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.full_name = `${user.first_name} ${user.last_name}`.trim();
    this.email = user.email;
    this.age = user.age ?? null;
    this.role = user.role;
    this.cart = user.cart ? String(user.cart._id ?? user.cart) : null;
  }
}

// DTO de entrada para el registro: filtra campos permitidos y evita que
// un cliente se asigne el rol "admin" o inyecte campos arbitrarios.
export class CreateUserDTO {
  constructor({ first_name, last_name, email, age, password }) {
    this.first_name = typeof first_name === 'string' ? first_name.trim() : first_name;
    this.last_name = typeof last_name === 'string' ? last_name.trim() : last_name;
    this.email = typeof email === 'string' ? email.toLowerCase().trim() : email;
    this.age = age !== undefined && age !== '' ? Number(age) : undefined;
    this.password = password;
  }
}

// DTO de entrada para la actualización de usuarios por parte del admin.
export class UpdateUserDTO {
  constructor(body = {}) {
    const allowed = ['first_name', 'last_name', 'age', 'role'];
    for (const key of allowed) {
      if (body[key] !== undefined) this[key] = body[key];
    }
  }
}
