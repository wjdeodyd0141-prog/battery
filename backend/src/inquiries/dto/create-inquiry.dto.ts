import { IsString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateInquiryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  content: string;

  @IsBoolean()
  @IsOptional()
  isSecret?: boolean;
}
