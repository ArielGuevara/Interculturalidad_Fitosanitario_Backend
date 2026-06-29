describe('Environment Config', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should use default API URL when EXPO_PUBLIC_API_URL is not set', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    const { env } = require('../shared/config/env');
    expect(env.apiBaseUrl).toBe('http://10.0.2.2:3000/api');
  });

  it('should use EXPO_PUBLIC_API_URL when set', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.1:3000/api';
    const { env } = require('../shared/config/env');
    expect(env.apiBaseUrl).toBe('http://192.168.1.1:3000/api');
  });
});
