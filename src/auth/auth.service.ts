import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/users.schema';
import { UserSignInDto } from './dtos/userSignIn.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { getApiResponse } from 'src/utils';
import { CreateUserDto } from './dtos/createUser.dto';

export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}
  async signIn(userSignInDto: UserSignInDto) {
    try {
      const user = await this.userModel.findOne({ email: userSignInDto.email });
      if (!user) {
        return getApiResponse({}, '400', 'wrong email');
      }
      const result = await bcrypt.compare(
        userSignInDto.password,
        user.password,
      );

      if (result) {
        const payload = { sub: user._id, username: user.userName };
        const accessToken = await this.jwtService.signAsync(payload);
        return getApiResponse(
          { accessToken, userId: user._id },
          '200',
          'login successfull',
        );
      } else {
        return getApiResponse({}, '400', 'wrong password');
      }
    } catch (error) {
      console.log(error);
      return getApiResponse({}, '500', 'internal server error');
    }
  }

  async signUp(userSignUpDto: CreateUserDto) {
    try {
      const user = await this.userModel.findOne({ email: userSignUpDto.email });
      if (user) {
        return getApiResponse({}, '400', 'email already taken');
      }
      const hashedPassword = await bcrypt.hash(userSignUpDto.password, 10);
      const newUser = new this.userModel({
        email: userSignUpDto.email,
        password: hashedPassword,
        userName: userSignUpDto.userName,
      });
      await newUser.save();
      return getApiResponse({}, '201', 'user registered successfully');
    } catch (error) {
      console.log(error);
      return getApiResponse({}, '500', 'internal server error');
    }
  }
}
