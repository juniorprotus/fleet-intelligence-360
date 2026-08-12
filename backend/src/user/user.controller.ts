import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@ApiTags('User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @RequirePermissions(Permission.USERS_CREATE)
  @ApiOperation({ summary: 'Create a new user account with assigned role and data-scope' })
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  @RequirePermissions(Permission.USERS_READ)
  @ApiOperation({ summary: 'List all registered platform users with filters' })
  async findAll(
    @Query('role') role?: string,
    @Query('department') department?: string,
    @Query('search') search?: string,
  ) {
    return this.userService.findAll({ role, department, search });
  }

  @Get(':id')
  @RequirePermissions(Permission.USERS_READ)
  @ApiOperation({ summary: 'Get single user profile by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.USERS_UPDATE)
  @ApiOperation({ summary: 'Update user account, role, and data-scope assignment' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(id, dto);
  }

  @Put(':id/toggle-status')
  @RequirePermissions(Permission.USERS_DISABLE)
  @ApiOperation({ summary: 'Activate or deactivate user account' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.userService.toggleActiveStatus(id);
  }
}
