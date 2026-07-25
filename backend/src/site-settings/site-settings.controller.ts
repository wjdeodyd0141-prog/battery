import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SiteSettingsService, HeroSettings } from './site-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class SiteSettingsController {
  constructor(private siteSettingsService: SiteSettingsService) {}

  @Get('site-settings/hero')
  getHero() {
    return this.siteSettingsService.getHeroSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/site-settings/hero')
  setHero(@Body() body: Partial<HeroSettings>) {
    return this.siteSettingsService.setHeroSettings(body);
  }
}
