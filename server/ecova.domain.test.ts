import { describe, expect, it } from "vitest";
import { calculateReward, canTransitionPickup } from "@shared/ecova";

describe("Ecova reward engine", () => {
  it("calculates reward from verified weight only", () => {
    expect(calculateReward(4.7)).toBe(470);
    expect(calculateReward(4.7, 125)).toBe(588);
  });

  it("rejects invalid verified weight", () => {
    expect(() => calculateReward(0)).toThrow("Verified weight");
    expect(() => calculateReward(-2)).toThrow("Verified weight");
  });
});

describe("Ecova pickup state machine", () => {
  it("allows the controlled collection path", () => {
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
  });
});
