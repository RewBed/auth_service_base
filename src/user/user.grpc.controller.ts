import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from './user.service';

type VerifyAccessTokenRequest = {
  accessToken?: string;
};

@Controller()
export class UserGrpcController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod('AuthService', 'VerifyAccessToken')
  verifyAccessToken(data: VerifyAccessTokenRequest) {
    return this.userService.verifyAccessTokenForGrpc(data.accessToken ?? '');
  }
}
