import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 2, description: 'Auth Service user id (logical ref)' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiProperty({ example: 'EMP-0001', description: 'Unique employee number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeNo: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'john.doe@dexa.com' })
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiProperty({ example: 1, description: 'Department id' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  departmentId: number;

  @ApiProperty({ example: 10, description: 'Position id (must belong to department)' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  positionId: number;

  @ApiProperty({ example: -6.4024842, description: 'Employee location latitude' })
  @Type(() => Number)
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 106.8456, description: 'Employee location longitude' })
  @Type(() => Number)
  @IsLongitude()
  longitude: number;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
