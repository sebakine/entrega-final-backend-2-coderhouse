import { ALL_ROLES } from '../constants/roles.js';
import { CurrentUserDTO, UpdateUserDTO } from '../dto/user.dto.js';
import { cartRepository, userRepository } from '../repositories/index.js';
import { AppError } from '../utils/customError.js';

class UserService {
  getAll() {
    return userRepository.getAll();
  }

  async getById(id) {
    const user = await userRepository.getCurrent(id);
    if (!user) throw AppError.notFound('Usuario no encontrado');
    return user;
  }

  async update(id, body, requester) {
    const data = new UpdateUserDTO(body);
    if (Object.keys(data).length === 0) throw AppError.badRequest('No se enviaron campos para actualizar');
    if (data.role !== undefined && !ALL_ROLES.includes(data.role)) {
      throw AppError.badRequest(`Rol inválido. Valores permitidos: ${ALL_ROLES.join(', ')}`);
    }
    if (data.role !== undefined && String(requester.id) === String(id)) {
      throw AppError.badRequest('Un administrador no puede cambiar su propio rol');
    }
    const user = await userRepository.update(id, data);
    if (!user) throw AppError.notFound('Usuario no encontrado');
    return new CurrentUserDTO(user);
  }

  async delete(id, requester) {
    if (String(requester.id) === String(id)) {
      throw AppError.badRequest('Un administrador no puede eliminar su propia cuenta');
    }
    const user = await userRepository.delete(id);
    if (!user) throw AppError.notFound('Usuario no encontrado');
    if (user.cart) await cartRepository.delete(user.cart);
    return new CurrentUserDTO(user);
  }
}

export const userService = new UserService();
