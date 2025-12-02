import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extrai token do cookie
        (req: Request): string | null => {
          if (!req || !req.cookies) return null;

          const cookies = req.cookies as Record<string, string | undefined>;
          const token = cookies.token;

          return token ?? null;
        },
        // Extrai token do header Authorization Bearer
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!, // JWT_SECRET deve estar definido
    });
  }

  validate(payload: JwtPayload) {
    // Aqui você retorna o payload validado, que ficará disponível em @Req() req.user
    return payload;
  }
}
