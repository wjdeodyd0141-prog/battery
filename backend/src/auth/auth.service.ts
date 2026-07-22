import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CouponService } from '../coupon/coupon.service';

interface LoginAttempt { count: number; lockedUntil: number; }

// VULN-03: 카카오 OAuth 일회성 코드 저장 (accessToken만 임시 보관)
interface OAuthCode { token: string; expiresAt: number; }

@Injectable()
export class AuthService {
  private readonly failedLogins = new Map<string, LoginAttempt>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCK_DURATION = 15 * 60 * 1000;

  private readonly oauthCodes = new Map<string, OAuthCode>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private couponService: CouponService,
  ) {}

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

  // H-2: 리프레시 토큰을 SHA-256 해시로 저장
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
  }

  // 토큰 쌍 발급 + DB 저장
  private async signAndSaveTokens(userId: string, username: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, username, type: 'access' },
      { expiresIn: '1h' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId, username, type: 'refresh' },
      { expiresIn: '7d' },
    );
    await this.saveRefreshToken(userId, refreshToken);
    return { accessToken, refreshToken };
  }

  // H-2: DB 검증 + 토큰 로테이션
  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken) as any;
      if (payload.type !== 'refresh') throw new Error();

      const tokenHash = this.hashToken(refreshToken);
      const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
      if (!stored || stored.expiresAt < new Date()) {
        throw new Error('expired or not found');
      }

      // 로테이션: 기존 토큰 삭제 후 새로 발급
      await this.prisma.refreshToken.delete({ where: { tokenHash } });
      return this.signAndSaveTokens(payload.sub, payload.username);
    } catch {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }
  }

  // 로그아웃: DB에서 리프레시 토큰 삭제
  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    try {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    } catch { /* ignore */ }
  }

  // VULN-03: 카카오 OAuth 일회성 코드 발급 (60초 유효)
  generateOAuthCode(token: string): string {
    const code = crypto.randomBytes(32).toString('hex');
    this.oauthCodes.set(code, { token, expiresAt: Date.now() + 60_000 });
    return code;
  }

  // VULN-03: 코드 교환 → 쿠키용 토큰 쌍 + 사용자 반환
  async exchangeOAuthCodeFull(code: string) {
    const entry = this.oauthCodes.get(code);
    if (!entry || Date.now() > entry.expiresAt) {
      throw new UnauthorizedException('유효하지 않거나 만료된 코드입니다.');
    }
    this.oauthCodes.delete(code);

    // 저장된 accessToken에서 userId 추출
    const payload = this.jwtService.decode(entry.token) as any;
    if (!payload?.sub) throw new UnauthorizedException('코드 디코딩 실패');

    const { accessToken, refreshToken } = await this.signAndSaveTokens(payload.sub, payload.username);
    const user = await this.getMe(payload.sub);
    return { accessToken, refreshToken, user };
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (exists) throw new ConflictException('이미 사용 중인 이메일 또는 아이디입니다.');

    if (!dto.termsAgreed || !dto.privacyAgreed) {
      throw new ConflictException('필수 약관에 동의해주세요.');
    }

    const hashed = await bcrypt.hash(dto.password, 12);
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
    this.checkLock(dto.username);

    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user || !user.password || !(await bcrypt.compare(dto.password, user.password))) {
      this.recordFail(dto.username);
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    this.clearFail(dto.username);
    const tokens = await this.signAndSaveTokens(user.id, user.username);
    return {
      ...tokens,
      user: { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role },
    };
  }

  async googleLogin(code: string) {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenRes.ok) throw new UnauthorizedException('구글 인증에 실패했습니다.');
    const tokenData = await tokenRes.json();

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) throw new UnauthorizedException('구글 프로필 조회에 실패했습니다.');
    const profile = await profileRes.json();

    const googleId = String(profile.id);
    const googleEmail: string | null = profile.email ?? null;
    const googleName: string | null = profile.name ?? null;

    let user = await this.prisma.user.findUnique({ where: { googleId } });

    if (!user && googleEmail) {
      const byEmail = await this.prisma.user.findUnique({ where: { email: googleEmail } });
      if (byEmail) {
        user = await this.prisma.user.update({ where: { id: byEmail.id }, data: { googleId } });
      }
    }

    let isNewUser = false;
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          googleId,
          email: googleEmail,
          username: `google_${googleId}`,
          password: null,
          name: googleName,
          termsAgreedAt: new Date(),
          privacyAgreedAt: new Date(),
        },
      });
      isNewUser = true;
    }
    if (isNewUser) {
      this.couponService.issueByTrigger(user.id, 'SIGNUP').catch(() => {});
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, username: user.username, type: 'access' },
      { expiresIn: '1h' },
    );
    return { accessToken };
  }

  async kakaoLogin(code: string) {
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

    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) throw new UnauthorizedException('카카오 프로필 조회에 실패했습니다.');
    const profile = await profileRes.json();

    const kakaoId = String(profile.id);
    const kakaoEmail: string | null = profile.kakao_account?.email ?? null;
    const kakaoName: string | null = profile.kakao_account?.profile?.nickname ?? null;

    let user = await this.prisma.user.findUnique({ where: { kakaoId } });

    if (!user && kakaoEmail) {
      const byEmail = await this.prisma.user.findUnique({ where: { email: kakaoEmail } });
      if (byEmail) {
        user = await this.prisma.user.update({ where: { id: byEmail.id }, data: { kakaoId } });
      }
    }

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

    // 카카오 콜백: accessToken만 임시 발급 (oauth code에 저장, exchange 시 새 쌍 발급)
    const accessToken = this.jwtService.sign(
      { sub: user.id, username: user.username, type: 'access' },
      { expiresIn: '1h' },
    );
    return { accessToken };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, name: true, phone: true, address: true, role: true },
    });
  }
}
