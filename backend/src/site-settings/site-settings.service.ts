import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HeroSettings {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  imageUrl: string;
}

const DEFAULTS: HeroSettings = {
  badge: '⚡ 국내 최대 배터리 전문 쇼핑몰',
  title: '당신의 기기에 맞는',
  titleHighlight: '완벽한 배터리',
  subtitle: '리튬, 알카라인, 충전용 배터리까지 — 국내외 최고 브랜드 제품을 합리적인 가격으로 만나보세요.',
  imageUrl: '',
};

const KEY_MAP: Record<keyof HeroSettings, string> = {
  badge: 'hero_badge',
  title: 'hero_title',
  titleHighlight: 'hero_title_highlight',
  subtitle: 'hero_subtitle',
  imageUrl: 'hero_image_url',
};

@Injectable()
export class SiteSettingsService {
  constructor(private prisma: PrismaService) {}

  async getHeroSettings(): Promise<HeroSettings> {
    const rows = await this.prisma.siteSetting.findMany({
      where: { key: { in: Object.values(KEY_MAP) } },
    });
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return {
      badge: map[KEY_MAP.badge] ?? DEFAULTS.badge,
      title: map[KEY_MAP.title] ?? DEFAULTS.title,
      titleHighlight: map[KEY_MAP.titleHighlight] ?? DEFAULTS.titleHighlight,
      subtitle: map[KEY_MAP.subtitle] ?? DEFAULTS.subtitle,
      imageUrl: map[KEY_MAP.imageUrl] ?? DEFAULTS.imageUrl,
    };
  }

  async setHeroSettings(data: Partial<HeroSettings>): Promise<HeroSettings> {
    await Promise.all(
      (Object.keys(data) as Array<keyof HeroSettings>)
        .filter(k => data[k] !== undefined)
        .map(k =>
          this.prisma.siteSetting.upsert({
            where: { key: KEY_MAP[k] },
            update: { value: data[k] as string },
            create: { key: KEY_MAP[k], value: data[k] as string },
          }),
        ),
    );
    return this.getHeroSettings();
  }
}
