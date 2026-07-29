import { REFERRAL_REWARD } from "../constants/business.js";
import { BonusConfig } from "../models/BonusConfig.js";

export async function getBonusConfig() {
  let config = await BonusConfig.findOne().sort({ createdAt: -1 });

  if (!config) {
    config = await BonusConfig.create({
      defaultReward: REFERRAL_REWARD,
      activeBonus: REFERRAL_REWARD + 10,
      isActive: false
    });
  } else {
    let shouldSave = false;

    if (config.defaultReward === 10) {
      config.defaultReward = REFERRAL_REWARD;
      shouldSave = true;
    }

    if (config.activeBonus === 12) {
      config.activeBonus = REFERRAL_REWARD + 10;
      shouldSave = true;
    }

    if (shouldSave) {
      await config.save();
    }
  }

  return config;
}

export async function getCurrentReferralReward() {
  const config = await getBonusConfig();
  const now = new Date();
  const isBonusLive = config.isActive && config.expiresAt && new Date(config.expiresAt) > now;

  return {
    defaultReward: config.defaultReward,
    activeBonus: config.activeBonus,
    expiresAt: config.expiresAt,
    isBonusLive,
    currentReward: isBonusLive ? config.activeBonus : config.defaultReward
  };
}

export async function setBonusConfig({ activeBonus, expiresAt, isActive, defaultReward }) {
  const config = await getBonusConfig();

  if (defaultReward !== undefined) {
    config.defaultReward = Number(defaultReward);
  }
  if (activeBonus !== undefined) {
    config.activeBonus = Number(activeBonus);
  }
  if (expiresAt !== undefined) {
    config.expiresAt = expiresAt ? new Date(expiresAt) : null;
  }
  if (isActive !== undefined) {
    config.isActive = Boolean(isActive);
  }

  await config.save();
  return getCurrentReferralReward();
}
