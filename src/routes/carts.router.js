import { Router } from 'express';
import * as carts from '../controllers/carts.controller.js';
import { authenticated, cartOwnership, onlyUser } from '../middlewares/auth.middleware.js';
import { validateObjectId } from '../middlewares/validateObjectId.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Solo el rol "user" opera carritos y únicamente sobre el propio.
const ownCartAsUser = [...onlyUser, validateObjectId('cid', 'pid'), cartOwnership()];

// Lectura: el dueño del carrito o un administrador.
router.get(
  '/:cid',
  authenticated,
  validateObjectId('cid'),
  cartOwnership({ allowAdmin: true }),
  asyncHandler(carts.getCart),
);

router.post(
  ['/:cid/product/:pid', '/:cid/products/:pid'],
  ...ownCartAsUser,
  asyncHandler(carts.addProductToCart),
);
router.put('/:cid/products/:pid', ...ownCartAsUser, asyncHandler(carts.updateProductQuantity));
router.delete('/:cid/products/:pid', ...ownCartAsUser, asyncHandler(carts.removeProductFromCart));
router.put('/:cid', ...ownCartAsUser, asyncHandler(carts.replaceCartProducts));
router.delete('/:cid', ...ownCartAsUser, asyncHandler(carts.clearCart));

// Finalizar compra: genera el ticket.
router.post('/:cid/purchase', ...ownCartAsUser, asyncHandler(carts.purchaseCart));

export default router;
