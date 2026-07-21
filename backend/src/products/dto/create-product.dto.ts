import { IsString, IsInt, IsOptional, IsArray, IsBoolean, IsObject, IsNumber, Min, Max } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @IsArray()
  @IsOptional()
  detailImageUrls?: string[];

  @IsString()
  @IsOptional()
  detailContent?: string;

  @IsObject()
  @IsOptional()
  specs?: Record<string, string>;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  mileageRate?: number;

  @IsString()
  categoryId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
