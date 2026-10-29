import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from './auth.controller.js';
import { CLIENT_IP_HEADER } from './auth.js';

vi.mock('better-auth/node', () => ({
  toNodeHandler: vi.fn(() => vi.fn((_req: any, res: any) => res.status(200).send('handled'))),
}));

describe('AuthController', () => {
  const mockPrisma: any = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn().mockResolvedValue(1),
    },
    account: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
  };

  const mockAuth: any = {};
  let mockEnvConfig: Record<string, any>;
  let mockConfigService: any;

  beforeEach(() => {
    mockEnvConfig = {
      NODE_ENV: 'development',
      ENABLE_DEV_LOGIN: true,
      AUTH_SECRET: 'super-secret-key-that-is-at-least-32-chars-long',
      ALLOW_SIGNUPS: true,
      oauthProviders: [],
    };
    mockConfigService = {
      get: vi.fn((key: string) => mockEnvConfig[key]),
    };
  });

  it('should delegate request handling to toNodeHandler(auth)', async () => {
    const controller = new AuthController(mockPrisma, mockAuth, mockConfigService);
    const req: any = {
      url: '/api/auth/sign-in',
      ip: '198.51.100.7',
      headers: { [CLIENT_IP_HEADER]: '203.0.113.99' },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    await controller.handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('handled');
    // A client-sent value is replaced by the address Express resolved from TRUST_PROXY.
    expect(req.headers[CLIENT_IP_HEADER]).toBe('198.51.100.7');
  });

  it('should return auth configuration from injected config', async () => {
    mockEnvConfig.oauthProviders = ['google', 'github'];

    const controller = new AuthController(mockPrisma, mockAuth, mockConfigService);
    const config = await controller.getConfig();
    expect(config.devLoginEnabled).toBe(true);
    expect(config.allowSignups).toBe(true);
    expect(config.isFirstAccountSetup).toBe(false);
    expect(config.providers).toEqual(['google', 'github']);
  });

  it('reports first-account setup on an empty instance, but never in demo mode', async () => {
    mockPrisma.user.count.mockResolvedValueOnce(0);
    const controller = new AuthController(mockPrisma, mockAuth, mockConfigService);
    expect((await controller.getConfig()).isFirstAccountSetup).toBe(true);

    // A demo instance is empty after every nightly wipe, and nobody there is setting up an administrator.
    mockEnvConfig.DEMO_MODE = true;
    mockPrisma.user.count.mockResolvedValueOnce(0);
    expect((await controller.getConfig()).isFirstAccountSetup).toBe(false);
  });

  it('should reject dev login when disabled or in production', async () => {
    mockEnvConfig.ENABLE_DEV_LOGIN = false;
    const controller = new AuthController(mockPrisma, mockAuth, mockConfigService);
    const res: any = { cookie: vi.fn(), status: vi.fn(), json: vi.fn() };

    await expect(controller.devLogin({ email: 'q@local.com' }, res)).rejects.toThrow(
      'Dev login is disabled',
    );
  });

  it('should reject dev login for non-test email domains (e.g. victim@corporate.com)', async () => {
    const controller = new AuthController(mockPrisma, mockAuth, mockConfigService);
    const res: any = { cookie: vi.fn(), status: vi.fn(), json: vi.fn() };

    await expect(controller.devLogin({ email: 'victim@corporate.com' }, res)).rejects.toThrow(
      'Dev login is restricted to local development test domains',
    );
  });

  it('should issue dev login session and cookie for q@local.com using injected secret', async () => {
    const controller = new AuthController(mockPrisma, mockAuth, mockConfigService);
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'usr_1',
      name: 'Qarib',
      email: 'q@local.com',
      image: null,
    });
    mockPrisma.account.findFirst.mockResolvedValueOnce({ id: 'acc_1' });
    mockPrisma.session.create.mockResolvedValueOnce({
      id: 'ses_1',
      token: 'dev_tok_test',
      userId: 'usr_1',
      expiresAt: new Date(),
    });

    const res: any = {
      cookie: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await controller.devLogin({ email: 'q@local.com' }, res);

    expect(res.cookie).toHaveBeenCalledWith(
      'better-auth.session_token',
      expect.stringContaining('dev_tok_'),
      expect.any(Object),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
