import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { AuthResponseDto } from './dtos/auth-response.dto';

@ApiTags('Auth Service')
@Controller('auth')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account and returns authentication tokens',
  })
  @ApiCreatedResponse({
    description: 'User has been successfully created',
    type: AuthResponseDto,
  })
  async register(
    @Body() createUserDto: CreateUserDto
  ): Promise<AuthResponseDto> {
    return this.appService.registerNewUser(createUserDto);
  }
}
