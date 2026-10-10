import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';

const scrypt = promisify(scryptCallback);
const TOKEN_LIFETIME_SECONDS = 60 * 60 * 24;

export type AuthUser = Pick<
  User,
  'id' | 'email' | 'first_name' | 'last_name' | 'organization' | 'role' | 'facility_id'
>;

export interface RegisterDto {
  full_name: string;
  email: string;
  password: string;
  organization: string;
  role?: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

interface TokenPayload {
  sub: string;
  exp: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email?.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new BadRequestException('A valid email address is required');
    }
    if (!dto.full_name?.trim() || !dto.organization?.trim()) {
      throw new BadRequestException('Full name and organization are required');
    }
    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('An account with this email already exists');
    }

    const names = dto.full_name.trim().split(/\s+/);
    const user = this.userRepository.create({
      email,
      password_hash: await this.hashPassword(dto.password),
      first_name: names.shift() || '',
      last_name: names.join(' '),
      organization: dto.organization.trim(),
      is_active: true,
      role: [UserRole.NURSE, UserRole.HOSPITAL_ADMIN, UserRole.AMBULANCE_DISPATCHER]
        .includes(dto.role as UserRole)
        ? dto.role
        : UserRole.NURSE,
    });

    const saved = await this.userRepository.save(user);
    return this.authResponse(saved);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email?.trim().toLowerCase() },
    });
    if (!user || !user.is_active || !user.password_hash) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!(await this.verifyPassword(dto.password || '', user.password_hash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    user.last_login_at = new Date();
    await this.userRepository.save(user);
    return this.authResponse(user);
  }

  async userFromToken(token: string): Promise<AuthUser> {
    const payload = this.verifyToken(token);
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Session is no longer valid');
    }
    return this.toPublicUser(user);
  }

  private authResponse(user: User) {
    return {
      access_token: this.signToken(user.id),
      expires_in: TOKEN_LIFETIME_SECONDS,
      user: this.toPublicUser(user),
    };
  }

  private toPublicUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      organization: user.organization,
      role: user.role,
      facility_id: user.facility_id,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derived.toString('hex')}`;
  }

  private async verifyPassword(password: string, encoded: string): Promise<boolean> {
    const [salt, storedHex] = encoded.split(':');
    if (!salt || !storedHex) return false;
    const stored = Buffer.from(storedHex, 'hex');
    const derived = (await scrypt(password, salt, stored.length)) as Buffer;
    return stored.length === derived.length && timingSafeEqual(stored, derived);
  }

  private signToken(userId: string): string {
    const payload: TokenPayload = {
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.secret()).update(encoded).digest('base64url');
    return `${encoded}.${signature}`;
  }

  private verifyToken(token: string): TokenPayload {
    const [encoded, suppliedSignature] = token.split('.');
    if (!encoded || !suppliedSignature) {
      throw new UnauthorizedException('Invalid session token');
    }
    const expected = createHmac('sha256', this.secret()).update(encoded).digest();
    const supplied = Buffer.from(suppliedSignature, 'base64url');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      throw new UnauthorizedException('Invalid session token');
    }

    try {
      const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as TokenPayload;
      if (!payload.sub || payload.exp <= Math.floor(Date.now() / 1000)) {
        throw new Error('expired');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Session token has expired or is invalid');
    }
  }

  private secret(): string {
    const secret = process.env.JWT_SECRET || 'medlink-development-secret-change-me';
    if (process.env.NODE_ENV === 'production' && secret.includes('development')) {
      throw new Error('JWT_SECRET must be configured in production');
    }
    return secret;
  }
}
