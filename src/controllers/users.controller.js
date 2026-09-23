import { userService } from '../services/user.service.js';

export const getUsers = async (_req, res) => {
  const users = await userService.getAll();
  res.json({ status: 'success', payload: users });
};

export const getUserById = async (req, res) => {
  const user = await userService.getById(req.params.uid);
  res.json({ status: 'success', payload: user });
};

export const updateUser = async (req, res) => {
  const user = await userService.update(req.params.uid, req.body, req.user);
  res.json({ status: 'success', message: 'Usuario actualizado', payload: user });
};

export const deleteUser = async (req, res) => {
  const user = await userService.delete(req.params.uid, req.user);
  res.json({ status: 'success', message: 'Usuario eliminado', payload: user });
};
