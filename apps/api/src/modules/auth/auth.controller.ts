import {
  Body,
  Controller,
  Get,
  Ip,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../../common/auth/roles.decorator';
import { AppError } from '../../common/errors/app-error';
import { loginSchema } from '@grh/validation';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ): Promise<unknown> {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw AppError.conflict('VALIDATION_ERROR', 'Identifiants invalides.');
    }
    const { identifiant, motDePasse } = parsed.data;
    const resultat = await this.auth.connexion(identifiant, motDePasse, { ip });
    res.cookie('grh_token', resultat.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });
    return {
      compte: resultat.compte,
      doitChangerMotDePasse: resultat.doitChangerMotDePasse,
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response): Promise<{ ok: true }> {
    res.clearCookie('grh_token', { path: '/' });
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: Request): Promise<unknown> {
    // req.user est injecté par la stratégie JWT (guard global)
    const user = (req as unknown as { user?: RequestUser }).user;
    if (!user) throw AppError.unauthorized('AUTH_REQUIRED', 'Authentification requise.');
    return this.auth.me(user);
  }

  @Patch('password')
  async changerMotDePasse(
    @Req() req: Request,
    @Body() body: { ancienMotDePasse: string; nouveauMotDePasse: string },
  ): Promise<{ ok: true }> {
    const user = (req as unknown as { user?: RequestUser }).user;
    if (!user) throw AppError.unauthorized('AUTH_REQUIRED', 'Authentification requise.');
    await this.auth.changerMotDePasse(
      user,
      body.ancienMotDePasse,
      body.nouveauMotDePasse,
    );
    return { ok: true };
  }
}