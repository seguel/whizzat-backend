import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  //Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { usuario } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() data: usuario): Promise<usuario> {
    return this.userService.createUser(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getUsers(): Promise<usuario[]> {
    return this.userService.getUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getUser(@Param('id', ParseIntPipe) id: number): Promise<usuario | null> {
    return this.userService.getUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<usuario>,
  ): Promise<usuario> {
    return this.userService.updateUser(id, data);
  }

  /* @Delete(':id')
  deleteUser(@Param('id', ParseIntPipe) id: number): Promise<usuario> {
    return this.userService.deleteUser(id);
  } */
}
