import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CouponService } from '../coupon/coupon.service';

// VULN-11: 로그인 실패 추적 (계정 잠금)
interface LoginAttempt { count: number; lockedUntil: number; }

// VULN-03: 카카오 OAuth 일회성 코드 저장
interface OAuthCode { token: string; expiresAt: number; }

@Injectable()
export class AuthService {
  // VULN-11
  private readonly failedLogins = new Map<string, LoginAttempt>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCK_DURATION = 15 * 60 * 1000;

  // VULN-03
  private readonly oauthCodes = new Map<string, OAuthCode>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private couponService: CouponService,
  ) {}

  // VULN-11: 잠금 여부 확인
  private checkLock(username: string) {
    const a = this.failedLogins.get(username);
    if (a && a.lockedUntil > Date.now()) {
      const mins = Math.ceil((a.lockedUntil - Date.now()) / 60000);
      throw new UnauthorizedException(`계정이 잠겼습니다. ${mins}분 후 다시 시도해주세요.`);
    }
  }

  private recordFail(username: string) {
    const a = this.failedLogins.get(username) ?? { count: 0, lockedUntil: 0 };
    a.count += 1;
    if (a.count >= this.MAX_ATTEMPTS) {
      a.lockedUntil = Date.now() + this.LOCK_DURATION;
      a.count = 0;
    }
    this.failedLogins.set(username, a);
  }

  private clearFail(username: string) {
    this.failedLogins.delete(username);
  }

  // VULN-03: 카카오 OAuth 일회성 코드 발급 (60초 유효)
  generateOAuthCode(token: string): string {
    const code = crypto.randomBytes(32).toString('hex');
    this.oauthCodes.set(code, { token, expiresAt: Date.now() + 60_000 });
    return code;
  }

  exchangeOAuthCode(code: string): string {
    const entry = this.oauthCodes.get(code);
    if (!entry || Date.now() > entry.expiresAt) {
      throw new UnauthorizedException('유효하지 않거나 만료된 코드입니다.');
    }
    this.oauthCodes.delete(code);
    return entry.token;
  }

  // VULN-12: Access Token(1h) + Refresh Token(7d) 발급
  private signTokens(userId: string, username: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, username, type: 'access' },
      { expiresIn: '1h' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId, username, type: 'refresh' },
      { expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }

  refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken) as any;
      if (payload.type !== 'refresh') throw new Error();
      const accessToken = this.jwtService.sign(
        { sub: payload.sub, username: payload.username, type: 'access' },
        { expiresIn: '1h' },
      );
      return { accessToken };
    } catch {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (exists) throw new ConflictException('이미 사용 중인 이메일 또는 아이디입니다.');

    if (!dto.termsAgreed || !dto.privacyAgreed) {
      throw new ConflictException('필수 약관에 동의해주세요.');
    }

    const hashed = await bcrypt.hash(dto.password, 12); // VULN-14: 비용 계수 12
    const now = new Date();
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashed,
        name: dto.name,
        phone: dto.phone,
        termsAgreedAt: now,
        privacyAgreedAt: now,
        marketingAgreedAt: dto.marketingAgreed ? now : null,
      },
      select: { id: true, email: true, username: true, name: true, role: true },
    });
    this.couponService.issueByTrigger(user.id, 'SIGNUP').catch(() => {});
    return user;
  }

  async login(dto: LoginDto) {
    // VULN-11: 잠금 확인
    this.checkLock(dto.username);

    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user || !user.password || !(await bcrypt.compare(dto.password, user.password))) {
      this.recordFail(dto.username); // VULN-11: 실패 기록
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    this.clearFail(dto.username); // VULN-11: 성공 시 초기화
    const { accessToken, refreshToken } = this.signTokens(user.id, user.username);
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role },
    };
  }

  async kakaoLogin(code: string) {
    // 1. 카카오 액세스 토큰 발급
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID!,
        redirect_uri: process.env.KAKAO_REDIRECT_URI!,
        code,
        ...(process.env.KAKAO_CLIENT_SECRET ? { client_secret: process.env.KAKAO_CLIENT_SECRET } : {}),
      }).toString(),
    });

    if (!tokenRes.ok) throw new UnauthorizedException('카카오 인증에 실패했습니다.');
    const tokenData = await tokenRes.json();

    // 2. 카카오 프로필 조회
    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) throw new UnauthorizedException('카카오 프로필 조회에 실패했습니다.');
    const profile = await profileRes.json();

    const kakaoId = String(profile.id);
    const kakaoEmail: string | null = profile.kakao_account?.email ?? null;
    const kakaoName: string | null = profile.kakao_account?.profile?.nickname ?? null;

    // 3. 기존 카카오 계정 조회
    let user = await this.prisma.user.findUnique({ where: { kakaoId } });

    // 4. 동일 이메일 일반 계정이 있으면 연동
    if (!user && kakaoEmail) {
      const byEmail = await this.prisma.user.findUnique({ where: { email: kakaoEmail } });
      if (byEmail) {
        user = await this.prisma.user.update({ where: { id: byEmail.id }, data: { kakaoId } });
      }
    }

    // 5. 신규 회원 생성
    let isNewUser = false;
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          kakaoId,
          email: kakaoEmail,
          username: `kakao_${kakaoId}`,
          password: null,
          name: kakaoName,
          termsAgreedAt: new Date(),
          privacyAgreedAt: new Date(),
        },
      });
      isNewUser = true;
    }
    if (isNewUser) {
      this.couponService.issueByTrigger(user.id, 'SIGNUP').catch(() => {});
    }

    const { accessToken, refreshToken } = this.signTokens(user.id, user.username);
    return { accessToken, refreshToken };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, name: true, phone: true, address: true, role: true },
    });
  }
}
