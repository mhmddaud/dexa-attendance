import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Fields the client submits for check-in / check-out (multipart/form-data).
 * The `photo` file is handled separately by the gateway upload interceptor;
 * `userId` is taken from the JWT and never from the client body.
 */
export class AttendanceActionDto {
  @ApiProperty({ example: -6.4024842, description: 'GPS latitude' })
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 106.8456, description: 'GPS longitude' })
  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ example: 'Datang ke kantor' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/**
 * Internal payload sent from the gateway to the Attendance Service over TCP.
 * The gateway resolves userId (JWT), the saved photo path, and the server
 * timestamp before forwarding.
 */
export interface AttendanceCheckPayload {
  userId: number;
  latitude: number;
  longitude?: number;
  note?: string;
  photoPath: string;
}

/** Query filters for HRD attendance listing. */
export class AttendanceQueryDto {
  @ApiPropertyOptional({ description: 'Filter by employee user id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Status filter',
    enum: ['PRESENT', 'LATE', 'ABSENT'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}
