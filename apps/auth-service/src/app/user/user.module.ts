import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaBaseModule } from 'packages/prisma/prisma-client-base';

@Module({
  imports: [PrismaBaseModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}