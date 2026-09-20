import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AUTH_PATTERNS } from '@app/common';
import type {
  CreateUserDto,
  PaginationQueryDto,
  UpdateUserDto,
} from '@app/dto';
import { AuthServiceService } from './auth-service.service';
import { UserService } from './user/user.service';

@Controller()
export class AuthServiceController {
  constructor(
    private readonly authService: AuthServiceService,
    private readonly userService: UserService,
  ) {}

  @MessagePattern(AUTH_PATTERNS.LOGIN)
  login(@Payload() data: { username: string; password: string }) {
    return this.authService.login(data.username, data.password);
  }

  @MessagePattern(AUTH_PATTERNS.FIND_BY_ID)
  findById(@Payload() data: { id: number }) {
    return this.authService.findById(data.id);
  }

  // ---------------- User management ----------------
  @MessagePattern(AUTH_PATTERNS.USER_LIST)
  listUsers(@Payload() query: PaginationQueryDto) {
    return this.userService.findAll(query);
  }

  @MessagePattern(AUTH_PATTERNS.USER_GET)
  getUser(@Payload() data: { id: number }) {
    return this.userService.findOne(data.id);
  }

  @MessagePattern(AUTH_PATTERNS.USER_CREATE)
  createUser(@Payload() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @MessagePattern(AUTH_PATTERNS.USER_UPDATE)
  updateUser(@Payload() data: { id: number; dto: UpdateUserDto }) {
    return this.userService.update(data.id, data.dto);
  }

  @MessagePattern(AUTH_PATTERNS.USER_DELETE)
  deleteUser(@Payload() data: { id: number }) {
    return this.userService.remove(data.id);
  }

  @MessagePattern(AUTH_PATTERNS.HEALTH)
  health() {
    return { status: 'ok', service: 'auth-service' };
  }
}
