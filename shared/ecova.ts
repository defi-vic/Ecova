export const DEMO_REWARD_RATE = 100;

export type EcovaPickupStatus = "REQUESTED" | "ASSIGNED" | "ARRIVED" | "COLLECTED" | "VERIFIED" | "DELIVERED" | "RECYCLED";

const transitions: Record<EcovaPickupStatus, EcovaPickupStatus[]> = {
  REQUESTED: ["ASSIGNED"],
  ASSIGNED: ["ARRIVED"],
  ARRIVED: ["COLLECTED"],
  COLLECTED: ["VERIFIED"],
  VERIFIED: ["DELIVERED"],
  DELIVERED: ["RECYCLED"],
  RECYCLED: [],
};

export function canTransitionPickup(from: EcovaPickupStatus, to: EcovaPickupStatus) {
  return transitions[from]?.includes(to) ?? false;
}

export function calculateReward(verifiedWeight: number, rewardRate = DEMO_REWARD_RATE) {
  if (!Number.isFinite(verifiedWeight) || verifiedWeight <= 0) throw new Error("Verified weight must be greater than zero");
  if (!Number.isFinite(rewardRate) || rewardRate <= 0) throw new Error("Reward rate must be greater than zero");
  return Math.round(verifiedWeight * rewardRate);
}
