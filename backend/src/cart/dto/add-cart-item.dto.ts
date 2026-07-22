import { IsString, IsInt, IsOptional, IsArray, Min, Max } from 'class-validator';

export class AddCartItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;

  @IsArray()
  @IsOptional()
  selectedOptions?: any[];
}
