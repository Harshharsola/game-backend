import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserSignInDto } from './dtos/userSignIn.dto';
import { CreateUserDto } from './dtos/createUser.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async signIn(@Body() userSignInDto: UserSignInDto, @Res() res) {
    const respone = await this.authService.signIn(userSignInDto);
    res.send(respone);
    return;
  }

  @Post('signup')
  async createUser(@Body() createUserDto: CreateUserDto, @Res() res) {
    const response = await this.authService.signUp(createUserDto);
    res.send(response);
    return;
  }
}
