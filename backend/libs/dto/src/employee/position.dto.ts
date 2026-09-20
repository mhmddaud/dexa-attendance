import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreatePositionDto {
  @ApiProperty({ example: 1, description: 'Owning department id' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  departmentId: number;

  @ApiProperty({ example: 'SSE', description: 'Unique position code' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Leads software development efforts' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdatePositionDto extends PartialType(CreatePositionDto) {}
