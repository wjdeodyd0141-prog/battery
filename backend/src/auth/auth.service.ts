import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (exists) throw new ConflictException('이미 사용 중인 이메일 또는 아이디입니다.');

    if (!dto.termsAgreed || !dto.privacyAgreed) {
      throw new ConflictException('필수 약관에 동의해주세요.');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
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
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user || !user.password || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const token = this.jwtService.sign({ sub: user.id, username: user.username });
    return {
      accessToken: token,
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
    }

    const token = this.jwtService.sign({ sub: user.id, username: user.username });
    return { accessToken: token };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, name: true, phone: true, address: true, role: true },
    });
  }
}
