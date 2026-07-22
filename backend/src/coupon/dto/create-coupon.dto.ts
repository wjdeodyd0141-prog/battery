import { IsString, IsEnum, IsNumber, IsOptional, Min, Max, MaxLength } from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEnum(['PERCENT', 'AMOUNT'])
  discountType: 'PERCENT' | 'AMOUNT';

  @IsNumber()
  @Min(1)
  @Max(100000)
  discountValue: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderAmount?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxDiscountAmount?: number;

  @IsString()
  @IsOptional()
  expiresAt?: string;

  @IsEnum(['NONE', 'SIGNUP', 'FIRST_PURCHASE'])
  @IsOptional()
  triggerType?: 'NONE' | 'SIGNUP' | 'FIRST_PURCHASE';
}
