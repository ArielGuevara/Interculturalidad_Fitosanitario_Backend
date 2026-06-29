import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('../data/auth/authApi', () => ({
  login: jest.fn(),
  register: jest.fn(),
}));

describe('AuthStore', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hydrate', () => {
    it('should set authenticated status when token and user exist', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('fake-token')
        .mockResolvedValueOnce(JSON.stringify({ id: 1, nombre: 'Test', email: 'test@test.com', rol: 'AGRICULTOR' }));

      const { useAuthStore } = require('../infrastructure/auth/authStore');
      const store = useAuthStore.getState();
      await store.hydrate();

      const state = useAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.accessToken).toBe('fake-token');
      expect(state.usuario).toBeTruthy();
    });

    it('should set unauthenticated status when no token exists', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const { useAuthStore } = require('../infrastructure/auth/authStore');
      const store = useAuthStore.getState();
      await store.hydrate();

      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.accessToken).toBeNull();
      expect(state.usuario).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear auth state and AsyncStorage', async () => {
      const { useAuthStore } = require('../infrastructure/auth/authStore');

      useAuthStore.setState({
        status: 'authenticated',
        accessToken: 'fake-token',
        usuario: { id: 1, nombre: 'Test', email: 'test@test.com', rol: 'AGRICULTOR' },
      });

      const store = useAuthStore.getState();
      await store.logout();

      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.accessToken).toBeNull();
      expect(state.usuario).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(2);
    });
  });
});
