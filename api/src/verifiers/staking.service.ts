import { Injectable } from '@nestjs/common';

export const MIN_STAKE_XLM = 1000;
export const STAKE_LOCK_DAYS = 30;
export const COOLDOWN_DAYS = 7;

@Injectable()
export class StakingService {
  calculateMinStake(): number {
    return MIN_STAKE_XLM;
  }

  getStakeLockPeriod(): number {
    return STAKE_LOCK_DAYS;
  }

  getCooldownPeriod(): number {
    return COOLDOWN_DAYS;
  }

  validateStake(amount: number): { valid: boolean; message: string } {
    if (amount < MIN_STAKE_XLM) {
      return {
        valid: false,
        message: `Minimum stake is ${MIN_STAKE_XLM} XLM (received ${amount} XLM)`,
      };
    }
    return { valid: true, message: 'Stake meets minimum requirements' };
  }

  calculateReputationScore(metrics: {
    accuracy: number;
    timeliness: number;
    volume: number;
    peerReviews: number;
    longevity: number;
  }): number {
    const weighted =
      metrics.accuracy * 0.4 +
      metrics.timeliness * 0.2 +
      metrics.volume * 0.15 +
      metrics.peerReviews * 0.15 +
      metrics.longevity * 0.1;

    return Math.min(Math.round(weighted * 100) / 100, 100);
  }

  isStakeLocked(stakedAt: Date): boolean {
    const lockPeriodMs = STAKE_LOCK_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - stakedAt.getTime() < lockPeriodMs;
  }

  isInCooldown(withdrawalRequestedAt: Date): boolean {
    const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - withdrawalRequestedAt.getTime() < cooldownMs;
  }
}
