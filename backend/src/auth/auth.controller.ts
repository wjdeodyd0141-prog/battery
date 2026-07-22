import { Controller, Post, Body, Get, UseGuards, Request, Query, Redirect, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// VULN-04: OAuth CSRF state 저장 (in-memory, 5분 TTL)
const oauthStates = new Map<string, number>();

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // VULN-12: Refresh token으로 새 access token 발급
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken || typeof body.refreshToken !== 'string') {
      throw new Error('refreshToken이 필요합니다.');
    }
    return this.authService.refreshAccessToken(body.refreshToken);
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

  // VULN-03: JWT를 URL에 노출하지 않고 일회성 코드로 전달
  // VULN-04: state 파라미터 검증
  @Get('kakao/callback')
  async kakaoCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: any,
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
      // VULN-03: 토큰 대신 일회성 코드를 URL에 담아 전달
      const oauthCode = this.authService.generateOAuthCode(accessToken);
      return res.redirect(`${frontendUrl}/auth/kakao/callback?code=${oauthCode}`);
    } catch {
      return res.redirect(`${frontendUrl}/login?error=kakao_failed`);
    }
  }

  // VULN-03: 일회성 코드를 실제 JWT로 교환
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Get('kakao/exchange')
  exchangeOAuthCode(@Query('code') code: string) {
    const accessToken = this.authService.exchangeOAuthCode(code);
    return { accessToken };
  }
}
