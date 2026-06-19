import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-z0-9_-]+$/, { message: '슬러그는 소문자 영문, 숫자, 하이픈, 언더스코어만 사용할 수 있습니다.' })
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;
}
