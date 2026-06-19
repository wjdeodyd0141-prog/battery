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
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const token = this.jwtService.sign({ sub: user.id, username: user.username });
    return {
      accessToken: token,
      user: { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role },
    };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, name: true, phone: true, address: true, role: true },
    });
  }
}
