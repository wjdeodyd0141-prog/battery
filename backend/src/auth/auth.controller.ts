import {
  Controller, Post, Body, Get, UseGuards, Request,
  Query, Redirect, Res, Req, HttpCode, HttpStatus, UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response, Request as ExpressRequest } from 'express';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// VULN-04: OAuth CSRF state 저장 (in-memory, 5분 TTL)
const oauthStates = new Map<string, number>();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, { ...COOKIE_OPTS, maxAge: 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  private clearCookies(res: Response) {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  // M-4: 쿠키에서 refresh token 읽어 새 쌍 발급
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken || typeof refreshToken !== 'string') {
      this.clearCookies(res);
      throw new UnauthorizedException('리프레시 토큰이 없습니다.');
    }
    const result = await this.authService.refreshAccessToken(refreshToken);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return { ok: true };
  }

  // 로그아웃: 쿠키 제거 + DB에서 토큰 삭제
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    await this.authService.logout(refreshToken);
    this.clearCookies(res);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return this.authService.getMe(req.user.id);
  }

  // VULN-04: state 파라미터 추가
  @Get('kakao')
  @Redirect()
  kakaoLogin() {
    const clientId = process.env.KAKAO_CLIENT_ID;
    const redirectUri = process.env.KAKAO_REDIRECT_URI;
    const state = crypto.randomBytes(16).toString('hex');
    oauthStates.set(state, Date.now() + 5 * 60 * 1000);
    const url = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&response_type=code&state=${state}`;
    return { url, statusCode: 302 };
  }

  // Google OAuth
  @Get('google')
  @Redirect()
  googleAuthRedirect() {
    const state = crypto.randomBytes(16).toString('hex');
    oauthStates.set(state, Date.now() + 5 * 60 * 1000);
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&response_type=code&scope=email+profile&state=${state}`;
    return { url, statusCode: 302 };
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const expiry = oauthStates.get(state);
    if (!state || !expiry || Date.now() > expiry) {
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }
    oauthStates.delete(state);
    try {
      const { accessToken } = await this.authService.googleLogin(code);
      const oauthCode = this.authService.generateOAuthCode(accessToken);
      return res.redirect(`${frontendUrl}/auth/google/callback?code=${oauthCode}`);
    } catch {
      return res.redirect(`${frontendUrl}/login?error=google_failed`);
    }
  }

  // VULN-03: JWT를 URL에 노출하지 않고 일회성 코드로 전달
  @Get('kakao/callback')
  async kakaoCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // VULN-04: state 검증
    const expiry = oauthStates.get(state);
    if (!state || !expiry || Date.now() > expiry) {
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }
    oauthStates.delete(state);

    try {
      const { accessToken } = await this.authService.kakaoLogin(code);
      const oauthCode = this.authService.generateOAuthCode(accessToken);
      return res.redirect(`${frontendUrl}/auth/kakao/callback?code=${oauthCode}`);
    } catch {
      return res.redirect(`${frontendUrl}/login?error=kakao_failed`);
    }
  }

  // VULN-03: 일회성 코드를 쿠키로 교환 (H-2: DB 저장 리프레시 토큰 발급)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Get('kakao/exchange')
  async exchangeOAuthCode(
    @Query('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.exchangeOAuthCodeFull(code);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }
}
