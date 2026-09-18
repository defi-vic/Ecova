import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { storagePut } from "./storage";
import { publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { appendPickupEvent, findPickup, getDb, getGeneratorState, getCollectorState, getProfileIds, nextPickupCode } from "./db";
import { chainOfCustodyEvents, collectionVerifications, collectorEarnings, collectors, pickupRequests, rewardTransactions, wasteSubmissions } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { calculateReward, canTransitionPickup, DEMO_REWARD_RATE, type EcovaPickupStatus } from "@shared/ecova";

const sessionKey = z.string().min(8).max(128);
const materialCondition = z.enum(["Clean", "Mostly clean", "Mixed", "Contaminated"]);
const base64Image = z.string().max(18_000_000).optional();

function trpcError(message: string, code: "BAD_REQUEST" | "CONFLICT" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR" = "BAD_REQUEST"): never {
  throw new TRPCError({ code, message });
}

function decodeImage(data: string) {
  const match = data.match(/^data:([^;]+);base64,([\s\S]*)$/);
  return { contentType: match?.[1] ?? "image/jpeg", base64: match?.[2] ?? data };
}

function imageExtension(contentType: string) {
  return contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
}

function splitWindow(window: string) {
  const [preferredDate, ...rest] = window.split(" · ");
  return { preferredDate: preferredDate || "Today", preferredTime: rest.join(" · ") || "14:00 – 16:00" };
}

async function uploadImage(data: string | undefined, keyBase: string) {
  if (!data) return undefined;
  const { contentType, base64 } = decodeImage(data);
  const bytes = Buffer.from(base64, "base64");
  if (!bytes.length) trpcError("The selected image could not be read.");
  try {
    return await storagePut(`${keyBase}.${imageExtension(contentType)}`, bytes, contentType);
  } catch (error) {
    console.error("[Ecova] image upload failed", error);
    trpcError("The image could not be stored. Please try again.", "INTERNAL_SERVER_ERROR");
  }
}

async function requireDb() {
  const db = await getDb();
  if (!db) trpcError("Ecova data is temporarily unavailable. Please try again.", "INTERNAL_SERVER_ERROR");
  return db;
}

const ecovaRouter = router({
  generatorState: publicProcedure.input(z.object({ generatorSessionKey: sessionKey, collectorSessionKey: sessionKey.optional() })).query(async ({ input }) => {
    try { return await getGeneratorState(input.generatorSessionKey, input.collectorSessionKey); } catch (error) { console.error("[Ecova] generator state failed", error); trpcError("Generator data could not be loaded. Please try again.", "INTERNAL_SERVER_ERROR"); }
  }),
  collectorState: publicProcedure.input(z.object({ collectorSessionKey: sessionKey, generatorSessionKey: sessionKey.optional() })).query(async ({ input }) => {
    try { return await getCollectorState(input.collectorSessionKey, input.generatorSessionKey); } catch (error) { console.error("[Ecova] collector state failed", error); trpcError("Collector data could not be loaded. Please try again.", "INTERNAL_SERVER_ERROR"); }
  }),
  classifyWaste: publicProcedure.input(z.object({ imageData: base64Image, estimatedWeight: z.number().positive().max(100), selectedMaterial: z.string().min(1) })).mutation(async ({ input }) => {
    return { detectedMaterial: input.selectedMaterial, confidence: null, contaminationEstimate: "Unknown", estimatedWeight: input.estimatedWeight, isFallback: true, notes: "Fallback classifier — no external vision model is configured. Final material and weight must be verified during collection." };
  }),
  createPickup: publicProcedure.input(z.object({
    generatorSessionKey: sessionKey,
    collectorSessionKey: sessionKey.optional(),
    material: z.string().min(1).max(160),
    estimatedWeight: z.number().positive().max(100),
    location: z.string().trim().min(3).max(500),
    pickupWindow: z.string().min(3).max(160),
    imageData: base64Image,
    detectedMaterial: z.string().optional(),
    aiConfidence: z.number().min(0).max(1).nullable().optional(),
    aiNotes: z.string().max(1000).optional(),
    contaminationEstimate: z.string().max(80).optional(),
  })).mutation(async ({ input }) => {
    const { db, generator } = await getProfileIds(input.generatorSessionKey, input.collectorSessionKey ?? "ecova-collector-demo");
    const pickupCode = await nextPickupCode(db);
    const image = await uploadImage(input.imageData, `ecova/waste-submissions/${pickupCode}-${Date.now()}`);
    const { preferredDate, preferredTime } = splitWindow(input.pickupWindow);
    try {
      await db.insert(pickupRequests).values({ pickupCode, generatorId: generator.id, materialType: input.material, estimatedWeight: input.estimatedWeight.toFixed(2), status: "REQUESTED", pickupLocation: input.location, preferredDate, preferredTime });
      const pickup = await findPickup(db, pickupCode);
      await db.insert(wasteSubmissions).values({ pickupId: pickup.id, imageUrl: image?.url, imageKey: image?.key, detectedMaterial: input.detectedMaterial ?? input.material, aiConfidence: input.aiConfidence === null || input.aiConfidence === undefined ? null : input.aiConfidence.toFixed(2), aiNotes: input.aiNotes ?? "Fallback classifier — no external vision model is configured. Final material and weight must be verified during collection.", estimatedWeight: input.estimatedWeight.toFixed(2), contaminationEstimate: input.contaminationEstimate ?? "Unknown" });
      await appendPickupEvent(db, pickup.id, "WASTE_SUBMITTED", generator.id, "GENERATOR", { imageStored: Boolean(image), imageUrl: image?.url ?? null });
      await appendPickupEvent(db, pickup.id, "AI_CLASSIFIED", generator.id, "GENERATOR", { detectedMaterial: input.detectedMaterial ?? input.material, fallback: !input.aiConfidence });
      await appendPickupEvent(db, pickup.id, "PICKUP_REQUESTED", generator.id, "GENERATOR", { estimatedWeight: input.estimatedWeight });
      return { pickupCode, imageUrl: image?.url ?? null };
    } catch (error) {
      console.error("[Ecova] pickup creation failed", error);
      trpcError("Your pickup could not be created. Please try again.", "INTERNAL_SERVER_ERROR");
    }
  }),
  setCollectorAvailability: publicProcedure.input(z.object({ collectorSessionKey: sessionKey, online: z.boolean() })).mutation(async ({ input }) => {
    const { db, collector } = await getProfileIds("ecova-generator-demo", input.collectorSessionKey);
    await db.update(collectors).set({ availabilityStatus: input.online ? "ONLINE" : "OFFLINE" }).where(eq(collectors.id, collector.id));
    return { online: input.online };
  }),
  acceptPickup: publicProcedure.input(z.object({ collectorSessionKey: sessionKey, pickupCode: z.string().min(1) })).mutation(async ({ input }) => {
    const { db, collector } = await getProfileIds("ecova-generator-demo", input.collectorSessionKey);
    const pickup = await findPickup(db, input.pickupCode);
    if (!canTransitionPickup(pickup.status as EcovaPickupStatus, "ASSIGNED")) trpcError(`Pickup ${input.pickupCode} is no longer available.`, "CONFLICT");
    const result = await db.update(pickupRequests).set({ collectorId: collector.id, status: "ASSIGNED" }).where(and(eq(pickupRequests.id, pickup.id), eq(pickupRequests.status, "REQUESTED")));
    if ((result as { affectedRows?: number }).affectedRows === 0) trpcError("This pickup was already assigned to another collector.", "CONFLICT");
    await appendPickupEvent(db, pickup.id, "COLLECTOR_ASSIGNED", collector.id, "COLLECTOR", { collector: collector.displayName });
    return { pickupCode: input.pickupCode, status: "ASSIGNED" as const };
  }),
  markArrived: publicProcedure.input(z.object({ collectorSessionKey: sessionKey, pickupCode: z.string().min(1) })).mutation(async ({ input }) => {
    const { db, collector } = await getProfileIds("ecova-generator-demo", input.collectorSessionKey);
    const pickup = await findPickup(db, input.pickupCode);
    if (pickup.collectorId !== collector.id || !canTransitionPickup(pickup.status as EcovaPickupStatus, "ARRIVED")) trpcError("This pickup is not assigned to your active route.", "CONFLICT");
    await db.update(pickupRequests).set({ status: "ARRIVED" }).where(eq(pickupRequests.id, pickup.id));
    await appendPickupEvent(db, pickup.id, "COLLECTOR_ARRIVED", collector.id, "COLLECTOR", { location: pickup.pickupLocation });
    return { pickupCode: input.pickupCode, status: "ARRIVED" as const };
  }),
  markCollected: publicProcedure.input(z.object({ collectorSessionKey: sessionKey, pickupCode: z.string().min(1) })).mutation(async ({ input }) => {
    const { db, collector } = await getProfileIds("ecova-generator-demo", input.collectorSessionKey);
    const pickup = await findPickup(db, input.pickupCode);
    if (pickup.collectorId !== collector.id || !canTransitionPickup(pickup.status as EcovaPickupStatus, "COLLECTED")) trpcError("Record arrival before collecting this pickup.", "CONFLICT");
    await db.update(pickupRequests).set({ status: "COLLECTED" }).where(eq(pickupRequests.id, pickup.id));
    await appendPickupEvent(db, pickup.id, "WASTE_COLLECTED", collector.id, "COLLECTOR", {});
    return { pickupCode: input.pickupCode, status: "COLLECTED" as const };
  }),
  verifyWeight: publicProcedure.input(z.object({ collectorSessionKey: sessionKey, pickupCode: z.string().min(1), verifiedWeight: z.number().positive().max(100), materialCondition, proofImageData: base64Image, notes: z.string().max(1000).optional() })).mutation(async ({ input }) => {
    const { db, collector } = await getProfileIds("ecova-generator-demo", input.collectorSessionKey);
    const pickup = await findPickup(db, input.pickupCode);
    if (pickup.collectorId !== collector.id || !canTransitionPickup(pickup.status as EcovaPickupStatus, "VERIFIED")) trpcError("Collect the material before verifying its weight.", "CONFLICT");
    const existing = await db.select().from(collectionVerifications).where(eq(collectionVerifications.pickupId, pickup.id)).limit(1);
    if (existing[0]) trpcError("This pickup has already been verified.", "CONFLICT");
    const proof = await uploadImage(input.proofImageData, `ecova/collection-proof/${input.pickupCode}-${Date.now()}`);
    const rewardAmount = calculateReward(input.verifiedWeight, DEMO_REWARD_RATE);
    try {
      await db.transaction(async (tx) => {
        await tx.insert(collectionVerifications).values({ pickupId: pickup.id, collectorId: collector.id, verifiedWeight: input.verifiedWeight.toFixed(2), materialCondition: input.materialCondition, proofImageUrl: proof?.url, proofImageKey: proof?.key, notes: input.notes });
        await tx.update(pickupRequests).set({ status: "VERIFIED", verifiedWeight: input.verifiedWeight.toFixed(2) }).where(and(eq(pickupRequests.id, pickup.id), eq(pickupRequests.status, "COLLECTED")));
        await tx.insert(rewardTransactions).values({ transactionCode: `TX-${pickup.pickupCode}`, generatorId: pickup.generatorId, pickupId: pickup.id, verifiedWeight: input.verifiedWeight.toFixed(2), rewardRate: DEMO_REWARD_RATE, rewardAmount, transactionType: "VERIFIED_COLLECTION" });
        await tx.insert(collectorEarnings).values({ collectorId: collector.id, pickupId: pickup.id, amount: Math.round(input.verifiedWeight * 20) });
        await tx.insert(chainOfCustodyEvents).values({ pickupId: pickup.id, eventType: "WEIGHT_VERIFIED", actorId: collector.id, actorRole: "COLLECTOR", metadata: JSON.stringify({ verifiedWeight: input.verifiedWeight, materialCondition: input.materialCondition, proofStored: Boolean(proof) }) });
        await tx.insert(chainOfCustodyEvents).values({ pickupId: pickup.id, eventType: "REWARD_ISSUED", actorId: pickup.generatorId, actorRole: "GENERATOR", metadata: JSON.stringify({ rewardAmount, rewardRate: DEMO_REWARD_RATE }) });
      });
      return { pickupCode: input.pickupCode, verifiedWeight: input.verifiedWeight, rewardAmount, proofImageUrl: proof?.url ?? null, status: "VERIFIED" as const };
    } catch (error) {
      console.error("[Ecova] verification failed", error);
      trpcError("The verification could not be saved. No reward was issued.", "INTERNAL_SERVER_ERROR");
    }
  }),
  redeemReward: publicProcedure.input(z.object({ generatorSessionKey: sessionKey, amount: z.number().int().positive() })).mutation(async ({ input }) => {
    const { db, generator } = await getProfileIds(input.generatorSessionKey, "ecova-collector-demo");
    const state = await getGeneratorState(input.generatorSessionKey);
    if (state.balance < input.amount) trpcError("This redemption is larger than the current ECO balance.", "BAD_REQUEST");
    const code = `REDEEM-${Date.now()}`;
    await db.insert(pickupRequests).values({ pickupCode: code, generatorId: generator.id, materialType: "Mobile Data redemption", estimatedWeight: "0", status: "RECYCLED", pickupLocation: "Prototype redemption", preferredDate: "TODAY", preferredTime: "NOW" });
    const pickup = await findPickup(db, code);
    await db.insert(rewardTransactions).values({ transactionCode: `TX-${code}`, generatorId: generator.id, pickupId: pickup.id, verifiedWeight: "0", rewardRate: 100, rewardAmount: -input.amount, transactionType: "REDEMPTION" });
    return { amount: input.amount, transactionCode: `TX-${code}` };
  }),
  events: publicProcedure.input(z.object({ generatorSessionKey: sessionKey, pickupCode: z.string().min(1) })).query(async ({ input }) => {
    const { db } = await getProfileIds(input.generatorSessionKey, "ecova-collector-demo");
    const pickup = await findPickup(db, input.pickupCode);
    return db.select().from(chainOfCustodyEvents).where(eq(chainOfCustodyEvents.pickupId, pickup.id));
  }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  ecova: ecovaRouter,
});

export type AppRouter = typeof appRouter;
