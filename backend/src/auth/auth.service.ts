import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { User } from './user.entity';

const BCRYPT_ROUNDS = 10;

export type AuthResponse = {
  accessToken: string;
  user: { id: number; username: string };
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: AuthCredentialsDto): Promise<AuthResponse> {
    const existing = await this.users.findOne({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException('Username already taken');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.users.create({
      username: dto.username,
      passwordHash,
    });
    await this.users.save(user);
    return this.issueTokens(user);
  }

  async login(dto: AuthCredentialsDto): Promise<AuthResponse> {
    const user = await this.users.findOne({
      where: { username: dto.username },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid username or password');
    }
    return this.issueTokens(user);
  }

  private issueTokens(user: User): AuthResponse {
    const accessToken = this.jwt.sign({
      sub: user.id,
      username: user.username,
    });
    return {
      accessToken,
      user: { id: user.id, username: user.username },
    };
  }
}
