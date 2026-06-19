import { IsString, IsOptional, IsBoolean, IsInt, IsUrl, MinLength, MaxLength, Min } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  @MinLength(1)
  imageUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitle?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitle?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
