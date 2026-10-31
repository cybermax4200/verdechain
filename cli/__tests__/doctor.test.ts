import { checkCommand, checkEnv } from '../src/commands/doctor';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('doctor command diagnostics', () => {
  describe('checkCommand', () => {
    it('should detect node is installed in environment', () => {
      const result = checkCommand('node');
      expect(result.name).toBe('node');
      expect(result.installed).toBe(true);
    });

    it('should detect non-existent tool as not installed', () => {
      const result = checkCommand('non_existent_binary_xyz_123');
      expect(result.name).toBe('non_existent_binary_xyz_123');
      expect(result.installed).toBe(false);
    });
  });

  describe('checkEnv', () => {
    it('should report reachable when API responds', async () => {
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ status: 200, data: {} }),
      } as any);

      const results = await checkEnv('http://localhost:3000');
      expect(results).toHaveLength(1);
      const res = results[0]!;
      expect(res.ok).toBe(true);
      expect(res.detail).toContain('(reachable)');
    });

    it('should report reachable status when server responds with 404 or other HTTP error', async () => {
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue({
          response: { status: 404 },
        }),
      } as any);

      const results = await checkEnv('http://localhost:3000');
      expect(results).toHaveLength(1);
      const res = results[0]!;
      expect(res.ok).toBe(true);
      expect(res.detail).toContain('status 404');
    });

    it('should report error when API host cannot be reached', async () => {
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      } as any);

      const results = await checkEnv('http://nonexistent.local:9999');
      expect(results).toHaveLength(1);
      const res = results[0]!;
      expect(res.ok).toBe(false);
      expect(res.detail).toContain('ECONNREFUSED');
    });
  });
});
