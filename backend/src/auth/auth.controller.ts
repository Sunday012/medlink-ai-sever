import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService, LoginDto, RegisterDto } from './auth.service';
import { Public } from './public.decorator';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  me(@Req() request: { user: unknown }) {
    return request.user;
  }
}
