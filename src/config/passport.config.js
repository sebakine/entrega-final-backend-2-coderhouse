import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { authService } from '../services/auth.service.js';
import { AppError } from '../utils/customError.js';
import { env } from './env.config.js';

// El JWT se lee desde la cookie firmada (httpOnly) o, alternativamente, desde el header Authorization.
const cookieExtractor = (req) => req?.signedCookies?.[env.COOKIE_NAME] ?? null;

const toInfo = (error) =>
  error instanceof AppError
    ? { message: error.message, statusCode: error.statusCode, details: error.details }
    : null;

export const initializePassport = () => {
  passport.use(
    'register',
    new LocalStrategy(
      { usernameField: 'email', passReqToCallback: true, session: false },
      async (req, _email, _password, done) => {
        try {
          const user = await authService.register(req.body);
          return done(null, user);
        } catch (error) {
          const info = toInfo(error);
          return info ? done(null, false, info) : done(error);
        }
      },
    ),
  );

  passport.use(
    'login',
    new LocalStrategy({ usernameField: 'email', session: false }, async (email, password, done) => {
      try {
        const user = await authService.validateCredentials(email, password);
        return done(null, user);
      } catch (error) {
        const info = toInfo(error);
        return info ? done(null, false, info) : done(error);
      }
    }),
  );

  // Estrategia "current": valida el JWT y deja en req.user un DTO sin datos sensibles.
  passport.use(
    'current',
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([
          cookieExtractor,
          ExtractJwt.fromAuthHeaderAsBearerToken(),
        ]),
        secretOrKey: env.JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const current = await authService.getCurrent(payload.sub);
          return done(null, current);
        } catch (error) {
          const info = toInfo(error);
          return info ? done(null, false, info) : done(error);
        }
      },
    ),
  );
};

export default passport;
