import { describe, expect, it } from "vitest";
import {
  calculateReward,
  canTransitionPickup,
  isSupportedMaterial,
  rewardTransactionCode,
  validateOperationalWeight,
} from "@shared/ecova";

describe("Ecova reward engine", () => {
  it("calculates reward from verified weight only", () => {
    expect(calculateReward(4.7)).toBe(470);
    expect(calculateReward(4.7, 125)).toBe(588);
  });

  it("rejects invalid, negative, zero, and impossible weights", () => {
    expect(() => calculateReward(0)).toThrow("Weight");
    expect(() => calculateReward(-2)).toThrow("Weight");
    expect(() => calculateReward(100.01)).toThrow("Weight");
    expect(() => validateOperationalWeight(Number.NaN)).toThrow("Weight");
  });

  it("uses one deterministic reward key per pickup", () => {
    expect(rewardTransactionCode("EC-1051")).toBe("TX-EC-1051");
    expect(rewardTransactionCode("EC-1051")).toBe(rewardTransactionCode("EC-1051"));
  });
});

describe("Ecova pickup state machine", () => {
  it("allows the controlled collection and hub path", () => {
    expect(canTransitionPickup("REQUESTED", "ASSIGNED")).toBe(true);
    expect(canTransitionPickup("ASSIGNED", "ARRIVED")).toBe(true);
    expect(canTransitionPickup("ARRIVED", "COLLECTED")).toBe(true);
    expect(canTransitionPickup("COLLECTED", "VERIFIED")).toBe(true);
    expect(canTransitionPickup("VERIFIED", "DELIVERED")).toBe(true);
    expect(canTransitionPickup("DELIVERED", "RECYCLED")).toBe(true);
  });

  it("blocks invalid jumps and duplicate terminal transitions", () => {
    expect(canTransitionPickup("REQUESTED", "RECYCLED")).toBe(false);
    expect(canTransitionPickup("REQUESTED", "VERIFIED")).toBe(false);
    expect(canTransitionPickup("VERIFIED", "RECYCLED")).toBe(false);
    expect(canTransitionPickup("RECYCLED", "ASSIGNED")).toBe(false);
    expect(canTransitionPickup("DELIVERED", "DELIVERED")).toBe(false);
  });
});

describe("Ecova input integrity", () => {
  it("accepts only supported single or combined materials", () => {
    expect(isSupportedMaterial("Plastic")).toBe(true);
    expect(isSupportedMaterial("Plastic + Glass")).toBe(true);
    expect(isSupportedMaterial("Plastic + Unknown")).toBe(false);
    expect(isSupportedMaterial("")).toBe(false);
  });
});
