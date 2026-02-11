import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AccessTokenGuard } from './guards/access-token.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [UserController],
  providers: [UserService, AccessTokenGuard],
})
export class UserModule {}
