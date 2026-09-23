import { Router } from 'express';
import * as products from '../controllers/products.controller.js';
import { onlyAdmin } from '../middlewares/auth.middleware.js';
import { validateObjectId } from '../middlewares/validateObjectId.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Lectura pública del catálogo
router.get('/', asyncHandler(products.getProducts));
router.get('/:pid', validateObjectId('pid'), asyncHandler(products.getProductById));

// Escritura: solo administrador (estrategia "current" + middleware de autorización)
router.post('/', ...onlyAdmin, asyncHandler(products.createProduct));
router.put('/:pid', ...onlyAdmin, validateObjectId('pid'), asyncHandler(products.updateProduct));
router.delete('/:pid', ...onlyAdmin, validateObjectId('pid'), asyncHandler(products.deleteProduct));

export default router;
