import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from '../entities/user.entity';

describe('AuthService', () => {
  const records: User[] = [];
  const repository = {
    findOne: jest.fn(async ({ where }: { where: Partial<User> }) =>
      records.find((user) =>
        Object.entries(where).every(([key, value]) => user[key as keyof User] === value),
      ) ?? null,
    ),
    create: jest.fn((input: Partial<User>) => Object.assign(new User(), input)),
    save: jest.fn(async (user: User) => {
      if (!user.id) user.id = `user-${records.length + 1}`;
      const index = records.findIndex((record) => record.id === user.id);
      if (index >= 0) records[index] = user;
      else records.push(user);
      return user;
    }),
  };

  let service: AuthService;

  beforeEach(() => {
    records.length = 0;
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-only-secret';
    service = new AuthService(repository as never);
  });

  it('registers, hashes the password, and authenticates the account', async () => {
    const registered = await service.register({
      full_name: 'Ada Okafor',
      email: 'ADA@example.com',
      password: 'correct-horse',
      organization: 'Kano General',
      role: UserRole.NURSE,
    });

    expect(registered.user.email).toBe('ada@example.com');
    expect(registered.access_token).toContain('.');
    expect(records[0].password_hash).not.toContain('correct-horse');

    const loggedIn = await service.login({
      email: 'ada@example.com',
      password: 'correct-horse',
    });
    expect(loggedIn.user.id).toBe(registered.user.id);
    await expect(service.userFromToken(loggedIn.access_token)).resolves.toMatchObject({
      email: 'ada@example.com',
    });
  });

  it('rejects an incorrect password', async () => {
    await service.register({
      full_name: 'Ada Okafor',
      email: 'ada@example.com',
      password: 'correct-horse',
      organization: 'Kano General',
    });

    await expect(
      service.login({ email: 'ada@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
