import { env } from '../config/env.config.js';

// Factory de DAOs: permite cambiar la persistencia (PERSISTENCE en .env)
// sin tocar repositories ni services.
const buildDAOs = async (persistence) => {
  switch (persistence) {
    case 'MONGO': {
      const [
        { default: UserMongoDAO },
        { default: ProductMongoDAO },
        { default: CartMongoDAO },
        { default: TicketMongoDAO },
      ] = await Promise.all([
        import('./mongo/user.mongo.dao.js'),
        import('./mongo/product.mongo.dao.js'),
        import('./mongo/cart.mongo.dao.js'),
        import('./mongo/ticket.mongo.dao.js'),
      ]);
      return {
        userDAO: new UserMongoDAO(),
        productDAO: new ProductMongoDAO(),
        cartDAO: new CartMongoDAO(),
        ticketDAO: new TicketMongoDAO(),
      };
    }
    default:
      throw new Error(`Persistencia no soportada: ${persistence}`);
  }
};

export const { userDAO, productDAO, cartDAO, ticketDAO } = await buildDAOs(env.PERSISTENCE);
