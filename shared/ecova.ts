export const DEMO_REWARD_RATE = 100;
export const MAX_OPERATIONAL_WEIGHT_KG = 100;
export const SUPPORTED_MATERIALS = ["Plastic", "Paper / Cardboard", "Glass", "E-Waste", "Organic"] as const;

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

export function isSupportedMaterial(value: string) {
  return value.split(" + ").every((item) => SUPPORTED_MATERIALS.includes(item as (typeof SUPPORTED_MATERIALS)[number]));
}

export function validateOperationalWeight(weight: number) {
  if (!Number.isFinite(weight) || weight <= 0 || weight > MAX_OPERATIONAL_WEIGHT_KG) throw new Error(`Weight must be greater than zero and no more than ${MAX_OPERATIONAL_WEIGHT_KG} KG`);
  return Number(weight.toFixed(2));
}

export function calculateReward(verifiedWeight: number, rewardRate = DEMO_REWARD_RATE) {
  validateOperationalWeight(verifiedWeight);
  if (!Number.isFinite(rewardRate) || rewardRate <= 0) throw new Error("Reward rate must be greater than zero");
  return Math.round(verifiedWeight * rewardRate);
}

export function rewardTransactionCode(pickupCode: string) {
  return `TX-${pickupCode}`;
}
