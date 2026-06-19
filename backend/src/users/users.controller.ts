import { Controller, Get, Patch, Body, UseGuards, Request, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import type { UpdateProfileDto, AdminUpdateUserDto } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  adminUpdate(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.usersService.adminUpdate(id, dto);
  }
}
