import { IsInt, IsOptional, IsString } from 'class-validator';

export class MessageDTO {
  @IsString()
  readonly prompt: string;
  @IsInt()
  @IsOptional()
  readonly maxTokens?: number;
}
