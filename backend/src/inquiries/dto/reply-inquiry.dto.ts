import { IsString, MinLength, MaxLength } from 'class-validator';

export class ReplyInquiryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  content: string;
}
