import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  chainOfCustodyEvents,
  collectionVerifications,
  collectorEarnings,
  collectors,
  generatorProfiles,
  pickupRequests,
  rewardTransactions,
  users,
  wasteSubmissions,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) {
    values.role = user.role ?? "admin";
    updateSet.role = values.role;
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export type EcovaEvent = {
  id: number;
  type: string;
  actorRole: string | null;
  actor: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type EcovaPickup = {
  id: string;
  date: string;
  material: string;
  weight: string;
  estimatedWeight: number;
  verifiedWeight?: number;
  collector: string;
  status: string;
  estimated: string;
  pickupWindow: string;
  location: string;
  reward: number;
  condition?: "Clean" | "Mostly clean" | "Mixed" | "Contaminated";
  arrivedAt?: string;
  verifiedAt?: string;
  imageUrl?: string;
  proofImageUrl?: string;
  aiConfidence?: number;
  aiNotes?: string;
  contaminationEstimate?: string;
  events: EcovaEvent[];
  isDemo?: boolean;
};

export type EcovaReward = {
  id: string;
  amount: number;
  pickupId: string;
  item: string;
  date: string;
  negative?: boolean;
};

const seedRecords = [
  { code: "EC-1048", material: "PET Plastic", estimated: 5, verified: 4.7, collector: "Daniel O.", location: "Eastside collection zone", date: "12 SEP", window: "14:00 – 16:00", condition: "Clean" as const, reward: 470 },
  { code: "EC-1042", material: "Cardboard", estimated: 8.5, verified: 8.2, collector: "M. Okafor", location: "North district", date: "09 SEP", window: "10:00 – 12:00", condition: "Mostly clean" as const, reward: 820 },
  { code: "EC-1038", material: "PET Plastic", estimated: 3.5, verified: 3.1, collector: "Daniel O.", location: "Ikeja zone 02", date: "04 SEP", window: "16:00 – 18:00", condition: "Clean" as const, reward: 310 },
];

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: Date | null | undefined, fallback = "TODAY") {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }).format(value).toUpperCase();
}

function formatTimestamp(value: Date | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(value).toUpperCase();
}

function parseMetadata(value: string | null) {
  if (!value) return {};
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return { note: value }; }
}

async function getOrCreateGenerator(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, sessionKey: string) {
  const existing = await db.select().from(generatorProfiles).where(eq(generatorProfiles.sessionKey, sessionKey)).limit(1);
  if (existing[0]) {
    if (sessionKey.startsWith("ecova-generator") && !existing[0].isDemo) {
      await db.update(generatorProfiles).set({ isDemo: true }).where(eq(generatorProfiles.id, existing[0].id));
      return { ...existing[0], isDemo: true };
    }
    return existing[0];
  }
  await db.insert(generatorProfiles).values({ sessionKey, displayName: "Demo Generator", role: "GENERATOR", isDemo: sessionKey.startsWith("ecova-generator") });
  const created = await db.select().from(generatorProfiles).where(eq(generatorProfiles.sessionKey, sessionKey)).limit(1);
  if (!created[0]) throw new Error("Unable to create generator profile");
  return created[0];
}

export async function getOrCreateCollector(sessionKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const existing = await db.select().from(collectors).where(eq(collectors.sessionKey, sessionKey)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(collectors).values({ sessionKey, displayName: "Demo Collector", verificationStatus: "VERIFIED", availabilityStatus: "ONLINE", vehicleInformation: "Route 07 · Ikeja", currentCapacity: "0" });
  const created = await db.select().from(collectors).where(eq(collectors.sessionKey, sessionKey)).limit(1);
  if (!created[0]) throw new Error("Unable to create collector profile");
  return created[0];
}

async function addEvent(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, pickupId: number, eventType: string, actorId: number | null, actorRole: string, metadata: Record<string, unknown> = {}) {
  await db.insert(chainOfCustodyEvents).values({ pickupId, eventType, actorId, actorRole, metadata: JSON.stringify(metadata) });
}

async function seedPickup(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, generatorId: number, collectorId: number, seed: typeof seedRecords[number]) {
  const found = await db.select().from(pickupRequests).where(eq(pickupRequests.pickupCode, seed.code)).limit(1);
  if (found[0]) return found[0];
  await db.insert(pickupRequests).values({ pickupCode: seed.code, generatorId, collectorId, materialType: seed.material, estimatedWeight: seed.estimated.toFixed(2), verifiedWeight: seed.verified.toFixed(2), status: "RECYCLED", pickupLocation: seed.location, preferredDate: seed.date, preferredTime: seed.window, isDemo: true });
  const pickup = (await db.select().from(pickupRequests).where(eq(pickupRequests.pickupCode, seed.code)).limit(1))[0];
  if (!pickup) throw new Error(`Unable to seed ${seed.code}`);
  await db.insert(wasteSubmissions).values({ pickupId: pickup.id, detectedMaterial: seed.material, aiConfidence: "0.94", aiNotes: "Seed presentation record. New uploads use the configured fallback classifier until a vision service is connected.", estimatedWeight: seed.estimated.toFixed(2), contaminationEstimate: seed.condition === "Clean" ? "Low" : "Medium" });
  await db.insert(collectionVerifications).values({ pickupId: pickup.id, collectorId, verifiedWeight: seed.verified.toFixed(2), materialCondition: seed.condition, verifiedAt: new Date(), notes: "Seed presentation record" });
  await db.insert(rewardTransactions).values({ transactionCode: `TX-${seed.code.replace("EC-", "")}`, generatorId, pickupId: pickup.id, verifiedWeight: seed.verified.toFixed(2), rewardRate: 100, rewardAmount: seed.reward, transactionType: "VERIFIED_COLLECTION" });
  await db.insert(collectorEarnings).values({ collectorId, pickupId: pickup.id, amount: Math.round(seed.verified * 20) });
  for (const eventType of ["WASTE_SUBMITTED", "AI_CLASSIFIED", "PICKUP_REQUESTED", "COLLECTOR_ASSIGNED", "COLLECTOR_ARRIVED", "WASTE_COLLECTED", "WEIGHT_VERIFIED", "DELIVERED_TO_HUB", "RECYCLING_CONFIRMED", "REWARD_ISSUED"]) {
    await addEvent(db, pickup.id, eventType, eventType === "COLLECTOR_ASSIGNED" || eventType === "COLLECTOR_ARRIVED" || eventType === "WASTE_COLLECTED" || eventType === "WEIGHT_VERIFIED" ? collectorId : generatorId, eventType.startsWith("COLLECTOR") || eventType === "WASTE_COLLECTED" || eventType === "WEIGHT_VERIFIED" ? "COLLECTOR" : "GENERATOR", { seeded: true, ...(eventType === "WEIGHT_VERIFIED" ? { verifiedWeight: seed.verified } : {}) });
  }
  return pickup;
}

export async function ensureDemoData(generatorSessionKey: string, collectorSessionKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const generator = await getOrCreateGenerator(db, generatorSessionKey);
  const collector = await getOrCreateCollector(collectorSessionKey);
  const existing = await db.select({ id: pickupRequests.id }).from(pickupRequests).where(eq(pickupRequests.generatorId, generator.id)).limit(1);
  if (existing.length === 0 && generator.isDemo) {
    for (const seed of seedRecords) await seedPickup(db, generator.id, collector.id, seed);
  }
  return { db, generator, collector };
}

async function loadPickups(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, rows: any[]) {
  const ids = rows.map((row) => row.id);
  if (!ids.length) return [] as EcovaPickup[];
  const events = await db.select().from(chainOfCustodyEvents).where(inArray(chainOfCustodyEvents.pickupId, ids)).orderBy(chainOfCustodyEvents.id);
  const waste = await db.select().from(wasteSubmissions).where(inArray(wasteSubmissions.pickupId, ids));
  const verifications = await db.select().from(collectionVerifications).where(inArray(collectionVerifications.pickupId, ids));
  const rewards = await db.select().from(rewardTransactions).where(inArray(rewardTransactions.pickupId, ids));
  const collectorIds = rows.map((row) => row.collectorId).filter((id): id is number => Boolean(id));
  const collectorRows = collectorIds.length ? await db.select().from(collectors).where(inArray(collectors.id, collectorIds)) : [];
  return rows.map((row) => {
    const verification = verifications.find((item) => item.pickupId === row.id);
    const submission = waste.find((item) => item.pickupId === row.id);
    const reward = rewards.find((item) => item.pickupId === row.id);
    const collector = collectorRows.find((item) => item.id === row.collectorId);
    const pickupEvents = events.filter((event) => event.pickupId === row.id);
    const arrived = pickupEvents.find((event) => event.eventType === "COLLECTOR_ARRIVED");
    return {
      id: row.pickupCode,
      date: formatDate(row.createdAt),
      material: row.materialType,
      weight: verification ? `${asNumber(verification.verifiedWeight).toFixed(2)} KG` : `${asNumber(row.estimatedWeight).toFixed(1)} KG EST.`,
      estimatedWeight: asNumber(row.estimatedWeight),
      verifiedWeight: verification ? asNumber(verification.verifiedWeight) : undefined,
      collector: collector?.displayName ?? "Matching in progress",
      status: row.status,
      estimated: `${asNumber(row.estimatedWeight).toFixed(1)} KG EST.`,
      pickupWindow: `${row.preferredDate} · ${row.preferredTime}`,
      location: row.pickupLocation,
      reward: reward?.rewardAmount ?? 0,
      condition: verification?.materialCondition,
      arrivedAt: arrived ? formatTimestamp(arrived.createdAt) : undefined,
      verifiedAt: verification ? formatTimestamp(verification.verifiedAt) : undefined,
      imageUrl: submission?.imageUrl ?? undefined,
      proofImageUrl: verification?.proofImageUrl ?? undefined,
      aiConfidence: submission?.aiConfidence ? asNumber(submission.aiConfidence) : undefined,
      aiNotes: submission?.aiNotes ?? undefined,
      contaminationEstimate: submission?.contaminationEstimate ?? undefined,
      events: pickupEvents.map((event) => ({ id: event.id, type: event.eventType, actorRole: event.actorRole, actor: event.actorRole === "COLLECTOR" ? collector?.displayName ?? "Collector" : "Generator", metadata: parseMetadata(event.metadata), createdAt: formatTimestamp(event.createdAt) })),
      isDemo: Boolean(row.isDemo),
    } satisfies EcovaPickup;
  });
}

export async function getGeneratorState(generatorSessionKey: string, collectorSessionKey = "ecova-collector-demo") {
  const { db, generator, collector } = await ensureDemoData(generatorSessionKey, collectorSessionKey);
  const rows = await db.select().from(pickupRequests).where(eq(pickupRequests.generatorId, generator.id)).orderBy(desc(pickupRequests.id)).limit(100);
  const pickups = await loadPickups(db, rows);
  const rewards = await db.select().from(rewardTransactions).where(eq(rewardTransactions.generatorId, generator.id)).orderBy(desc(rewardTransactions.id));
  const transactions: EcovaReward[] = rewards.map((item) => ({ id: item.transactionCode, amount: item.rewardAmount, pickupId: rows.find((row) => row.id === item.pickupId)?.pickupCode ?? "", item: `${rows.find((row) => row.id === item.pickupId)?.materialType ?? "Collection"} · ${asNumber(item.verifiedWeight).toFixed(2)} KG verified`, date: formatDate(item.createdAt), negative: item.rewardAmount < 0 }));
  const verified = pickups.filter((pickup) => pickup.verifiedWeight !== undefined);
  const totalDiverted = verified.reduce((sum, pickup) => sum + (pickup.verifiedWeight ?? 0), 0);
  const plasticDiverted = verified.filter((pickup) => pickup.material.toLowerCase().includes("plastic")).reduce((sum, pickup) => sum + (pickup.verifiedWeight ?? 0), 0);
  return { pickups, balance: transactions.reduce((sum, item) => sum + item.amount, 0), transactions, impact: { totalDiverted: Number(totalDiverted.toFixed(1)), plasticDiverted: Number(plasticDiverted.toFixed(1)), verifiedCollections: verified.length, co2e: Number((totalDiverted * 0.19).toFixed(1)), facilities: verified.length ? 1 : 0 }, profile: { id: generator.id, displayName: generator.displayName }, collector: { id: collector.id, displayName: collector.displayName } };
}

export async function getCollectorState(collectorSessionKey: string, generatorSessionKey = "ecova-generator-demo") {
  const { db, collector } = await ensureDemoData(generatorSessionKey, collectorSessionKey);
  const rows = await db.select().from(pickupRequests).where(sql`${pickupRequests.status} in ('REQUESTED', 'ASSIGNED', 'ARRIVED', 'COLLECTED', 'VERIFIED', 'DELIVERED', 'RECYCLED')`).orderBy(desc(pickupRequests.id)).limit(100);
  const pickups = await loadPickups(db, rows);
  const earnings = await db.select().from(collectorEarnings).where(eq(collectorEarnings.collectorId, collector.id)).orderBy(desc(collectorEarnings.id));
  const earningsByPickup = await db.select().from(pickupRequests).where(inArray(pickupRequests.id, earnings.map((item) => item.pickupId).length ? earnings.map((item) => item.pickupId) : [0]));
  return { pickups, collector: { id: collector.id, displayName: collector.displayName, availabilityStatus: collector.availabilityStatus, verificationStatus: collector.verificationStatus, currentCapacity: asNumber(collector.currentCapacity) }, earnings: earnings.map((item) => ({ id: `CE-${item.id}`, amount: item.amount, pickupId: earningsByPickup.find((pickup) => pickup.id === item.pickupId)?.pickupCode ?? "", item: "Verified collection route", date: formatDate(item.createdAt) })) };
}

export async function findPickup(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, pickupCode: string) {
  const row = (await db.select().from(pickupRequests).where(eq(pickupRequests.pickupCode, pickupCode)).limit(1))[0];
  if (!row) throw new Error("Pickup not found");
  return row;
}

export async function appendPickupEvent(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, pickupId: number, eventType: string, actorId: number | null, actorRole: string, metadata: Record<string, unknown> = {}) {
  await addEvent(db, pickupId, eventType, actorId, actorRole, metadata);
}

export async function getProfileIds(generatorSessionKey: string, collectorSessionKey: string) {
  const { generator, collector, db } = await ensureDemoData(generatorSessionKey, collectorSessionKey);
  return { db, generator, collector };
}

export async function nextPickupCode(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const rows = await db.select({ pickupCode: pickupRequests.pickupCode }).from(pickupRequests).orderBy(desc(pickupRequests.id)).limit(1000);
  const max = rows.reduce((highest, row) => Math.max(highest, Number(row.pickupCode.replace("EC-", "")) || 0), 1050);
  return `EC-${max + 1}`;
}

export { and, desc, eq, inArray, sql };
