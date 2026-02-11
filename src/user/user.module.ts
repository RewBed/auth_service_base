import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AccessTokenGuard } from './guards/access-token.guard';
import { UserGrpcController } from './user.grpc.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [UserController, UserGrpcController],
  providers: [UserService, AccessTokenGuard],
})
export class UserModule {}
