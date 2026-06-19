import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsBoolean, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @IsString()
  @MinLength(4, { message: '아이디는 4자 이상이어야 합니다.' })
  @MaxLength(20, { message: '아이디는 20자 이하여야 합니다.' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '아이디는 영문, 숫자, 밑줄(_)만 사용 가능합니다.' })
  username: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @MaxLength(64, { message: '비밀번호는 64자 이하여야 합니다.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, { message: '비밀번호는 영문과 숫자를 포함해야 합니다.' })
  password: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  termsAgreed: boolean;

  @IsBoolean()
  privacyAgreed: boolean;

  @IsBoolean()
  @IsOptional()
  marketingAgreed?: boolean;
}
