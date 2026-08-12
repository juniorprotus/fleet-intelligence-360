import { IsEmail, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'new.user@fi360.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ enum: UserRole, example: 'FLEET_MANAGER' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'Fleet Operations' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'Nairobi' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 'Nairobi Main Workshop' })
  @IsOptional()
  @IsString()
  depot?: string;

  @ApiPropertyOptional({ example: 'KDA-123A' })
  @IsOptional()
  @IsString()
  assignedVehicleId?: string;

  @ApiPropertyOptional({ example: 'Main Branch' })
  @IsOptional()
  @IsString()
  branch?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'Nairobi', description: 'Region data scope for REGION-level users' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 'Nairobi Main Workshop', description: 'Depot scope for DEPOT-level users' })
  @IsOptional()
  @IsString()
  depot?: string;

  @ApiPropertyOptional({ example: 'KDA-123A', description: 'Assigned vehicle ID for DRIVER-level users' })
  @IsOptional()
  @IsString()
  assignedVehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}
