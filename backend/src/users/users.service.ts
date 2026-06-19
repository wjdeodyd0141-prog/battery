import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { IsOptional, IsString, IsEmail, IsEnum } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
}

export class AdminUpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsEnum(['USER', 'ADMIN']) role?: 'USER' | 'ADMIN';
}

const USER_SELECT = {
  id: true, email: true, username: true, name: true,
  phone: true, address: true, role: true, createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: USER_SELECT,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }

  async adminUpdate(id: string, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    if (dto.email && dto.email !== user.email) {
      const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (exists) throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        role: dto.role,
      },
      select: USER_SELECT,
    });
  }
}
