import {
  StakingService,
  MIN_STAKE_XLM,
  STAKE_LOCK_DAYS,
  COOLDOWN_DAYS,
} from '../../../src/verifiers/staking.service';

describe('StakingService', () => {
  let service: StakingService;

  beforeEach(() => {
    service = new StakingService();
  });

  describe('staking rules', () => {
    it('should return minimum required stake amount', () => {
      expect(service.calculateMinStake()).toBe(MIN_STAKE_XLM);
      expect(service.calculateMinStake()).toBe(1000);
    });

    it('should return stake lock period', () => {
      expect(service.getStakeLockPeriod()).toBe(STAKE_LOCK_DAYS);
      expect(service.getStakeLockPeriod()).toBe(30);
    });

    it('should return cooldown period', () => {
      expect(service.getCooldownPeriod()).toBe(COOLDOWN_DAYS);
      expect(service.getCooldownPeriod()).toBe(7);
    });

    it('should validate stake amount correctly', () => {
      expect(service.validateStake(1500).valid).toBe(true);
      expect(service.validateStake(1000).valid).toBe(true);

      const invalid = service.validateStake(999);
      expect(invalid.valid).toBe(false);
      expect(invalid.message).toContain('Minimum stake is 1000 XLM');
    });
  });

  describe('calculateReputationScore', () => {
    it('should compute weighted reputation score', () => {
      const score = service.calculateReputationScore({
        accuracy: 90,
        timeliness: 85,
        volume: 80,
        peerReviews: 95,
        longevity: 70,
      });

      // 90*0.4 + 85*0.2 + 80*0.15 + 95*0.15 + 70*0.1 = 36 + 17 + 12 + 14.25 + 7 = 86.25
      expect(score).toBe(86.25);
    });

    it('should cap reputation score at 100', () => {
      const score = service.calculateReputationScore({
        accuracy: 120,
        timeliness: 100,
        volume: 100,
        peerReviews: 100,
        longevity: 100,
      });
      expect(score).toBe(100);
    });
  });

  describe('lock and cooldown checks', () => {
    it('should determine if stake is locked', () => {
      const recentStake = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      expect(service.isStakeLocked(recentStake)).toBe(true);

      const maturedStake = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago
      expect(service.isStakeLocked(maturedStake)).toBe(false);
    });

    it('should determine if withdrawal is in cooldown', () => {
      const recentWithdrawal = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      expect(service.isInCooldown(recentWithdrawal)).toBe(true);

      const maturedWithdrawal = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      expect(service.isInCooldown(maturedWithdrawal)).toBe(false);
    });
  });
});
