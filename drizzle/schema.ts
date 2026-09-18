import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, uniqueIndex, index } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const generatorProfiles = mysqlTable("generator_profiles", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("sessionKey", { length: 128 }).notNull().unique(),
  displayName: varchar("displayName", { length: 160 }).notNull().default("Demo Generator"),
  role: mysqlEnum("role", ["GENERATOR"]).notNull().default("GENERATOR"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const collectors = mysqlTable("collectors", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("sessionKey", { length: 128 }).notNull().unique(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["VERIFIED", "PENDING", "UNVERIFIED"]).notNull().default("VERIFIED"),
  availabilityStatus: mysqlEnum("availabilityStatus", ["ONLINE", "OFFLINE", "BUSY"]).notNull().default("ONLINE"),
  vehicleInformation: varchar("vehicleInformation", { length: 255 }).notNull().default("Route 07 · Ikeja"),
  currentCapacity: decimal("currentCapacity", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const pickupRequests = mysqlTable("pickup_requests", {
  id: int("id").autoincrement().primaryKey(),
  pickupCode: varchar("pickupCode", { length: 32 }).notNull().unique(),
  generatorId: int("generatorId").notNull(),
  collectorId: int("collectorId"),
  materialType: varchar("materialType", { length: 160 }).notNull(),
  estimatedWeight: decimal("estimatedWeight", { precision: 10, scale: 2 }).notNull(),
  verifiedWeight: decimal("verifiedWeight", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["REQUESTED", "ASSIGNED", "ARRIVED", "COLLECTED", "VERIFIED", "DELIVERED", "RECYCLED"]).notNull().default("REQUESTED"),
  pickupLocation: varchar("pickupLocation", { length: 500 }).notNull(),
  preferredDate: varchar("preferredDate", { length: 80 }).notNull(),
  preferredTime: varchar("preferredTime", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ generatorIdx: index("pickup_requests_generator_idx").on(table.generatorId), statusIdx: index("pickup_requests_status_idx").on(table.status) }));

export const wasteSubmissions = mysqlTable("waste_submissions", {
  id: int("id").autoincrement().primaryKey(),
  pickupId: int("pickupId").notNull(),
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 500 }),
  detectedMaterial: varchar("detectedMaterial", { length: 160 }),
  aiConfidence: decimal("aiConfidence", { precision: 5, scale: 2 }),
  aiNotes: text("aiNotes"),
  estimatedWeight: decimal("estimatedWeight", { precision: 10, scale: 2 }).notNull(),
  contaminationEstimate: varchar("contaminationEstimate", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ pickupIdx: uniqueIndex("waste_submissions_pickup_idx").on(table.pickupId) }));

export const collectionVerifications = mysqlTable("collection_verifications", {
  id: int("id").autoincrement().primaryKey(),
  pickupId: int("pickupId").notNull(),
  collectorId: int("collectorId").notNull(),
  verifiedWeight: decimal("verifiedWeight", { precision: 10, scale: 2 }).notNull(),
  materialCondition: mysqlEnum("materialCondition", ["Clean", "Mostly clean", "Mixed", "Contaminated"]).notNull(),
  proofImageUrl: text("proofImageUrl"),
  proofImageKey: varchar("proofImageKey", { length: 500 }),
  verifiedAt: timestamp("verifiedAt").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ pickupIdx: uniqueIndex("collection_verifications_pickup_idx").on(table.pickupId) }));

export const rewardTransactions = mysqlTable("reward_transactions", {
  id: int("id").autoincrement().primaryKey(),
  transactionCode: varchar("transactionCode", { length: 64 }).notNull().unique(),
  generatorId: int("generatorId").notNull(),
  pickupId: int("pickupId").notNull(),
  verifiedWeight: decimal("verifiedWeight", { precision: 10, scale: 2 }).notNull(),
  rewardRate: int("rewardRate").notNull().default(100),
  rewardAmount: int("rewardAmount").notNull(),
  transactionType: mysqlEnum("transactionType", ["VERIFIED_COLLECTION", "REDEMPTION"]).notNull().default("VERIFIED_COLLECTION"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ pickupIdx: uniqueIndex("reward_transactions_pickup_idx").on(table.pickupId), generatorIdx: index("reward_transactions_generator_idx").on(table.generatorId) }));

export const collectorEarnings = mysqlTable("collector_earnings", {
  id: int("id").autoincrement().primaryKey(),
  collectorId: int("collectorId").notNull(),
  pickupId: int("pickupId").notNull(),
  amount: int("amount").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ pickupIdx: uniqueIndex("collector_earnings_pickup_idx").on(table.pickupId) }));

export const chainOfCustodyEvents = mysqlTable("chain_of_custody_events", {
  id: int("id").autoincrement().primaryKey(),
  pickupId: int("pickupId").notNull(),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  actorId: int("actorId"),
  actorRole: varchar("actorRole", { length: 40 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ pickupIdx: index("chain_events_pickup_idx").on(table.pickupId), typeIdx: index("chain_events_type_idx").on(table.eventType) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type GeneratorProfile = typeof generatorProfiles.$inferSelect;
export type Collector = typeof collectors.$inferSelect;
export type PickupRequest = typeof pickupRequests.$inferSelect;
export type WasteSubmission = typeof wasteSubmissions.$inferSelect;
export type CollectionVerification = typeof collectionVerifications.$inferSelect;
export type RewardTransaction = typeof rewardTransactions.$inferSelect;
export type CollectorEarning = typeof collectorEarnings.$inferSelect;
export type ChainOfCustodyEvent = typeof chainOfCustodyEvents.$inferSelect;
