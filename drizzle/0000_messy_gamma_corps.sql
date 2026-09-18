CREATE TABLE `chain_of_custody_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pickupId` int NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`actorId` int,
	`actorRole` varchar(40),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chain_of_custody_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collection_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pickupId` int NOT NULL,
	`collectorId` int NOT NULL,
	`verifiedWeight` decimal(10,2) NOT NULL,
	`materialCondition` enum('Clean','Mostly clean','Mixed','Contaminated') NOT NULL,
	`proofImageUrl` text,
	`proofImageKey` varchar(500),
	`verifiedAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_verifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `collection_verifications_pickup_idx` UNIQUE(`pickupId`)
);
--> statement-breakpoint
CREATE TABLE `collector_earnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectorId` int NOT NULL,
	`pickupId` int NOT NULL,
	`amount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collector_earnings_id` PRIMARY KEY(`id`),
	CONSTRAINT `collector_earnings_pickup_idx` UNIQUE(`pickupId`)
);
--> statement-breakpoint
CREATE TABLE `collectors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionKey` varchar(128) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`verificationStatus` enum('VERIFIED','PENDING','UNVERIFIED') NOT NULL DEFAULT 'VERIFIED',
	`availabilityStatus` enum('ONLINE','OFFLINE','BUSY') NOT NULL DEFAULT 'ONLINE',
	`vehicleInformation` varchar(255) NOT NULL DEFAULT 'Route 07 · Ikeja',
	`currentCapacity` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collectors_id` PRIMARY KEY(`id`),
	CONSTRAINT `collectors_sessionKey_unique` UNIQUE(`sessionKey`)
);
--> statement-breakpoint
CREATE TABLE `generator_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionKey` varchar(128) NOT NULL,
	`displayName` varchar(160) NOT NULL DEFAULT 'Demo Generator',
	`role` enum('GENERATOR') NOT NULL DEFAULT 'GENERATOR',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generator_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `generator_profiles_sessionKey_unique` UNIQUE(`sessionKey`)
);
--> statement-breakpoint
CREATE TABLE `pickup_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pickupCode` varchar(32) NOT NULL,
	`generatorId` int NOT NULL,
	`collectorId` int,
	`materialType` varchar(160) NOT NULL,
	`estimatedWeight` decimal(10,2) NOT NULL,
	`verifiedWeight` decimal(10,2),
	`status` enum('REQUESTED','ASSIGNED','ARRIVED','COLLECTED','VERIFIED','DELIVERED','RECYCLED') NOT NULL DEFAULT 'REQUESTED',
	`pickupLocation` varchar(500) NOT NULL,
	`preferredDate` varchar(80) NOT NULL,
	`preferredTime` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pickup_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `pickup_requests_pickupCode_unique` UNIQUE(`pickupCode`)
);
--> statement-breakpoint
CREATE TABLE `reward_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionCode` varchar(64) NOT NULL,
	`generatorId` int NOT NULL,
	`pickupId` int NOT NULL,
	`verifiedWeight` decimal(10,2) NOT NULL,
	`rewardRate` int NOT NULL DEFAULT 100,
	`rewardAmount` int NOT NULL,
	`transactionType` enum('VERIFIED_COLLECTION','REDEMPTION') NOT NULL DEFAULT 'VERIFIED_COLLECTION',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reward_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `reward_transactions_transactionCode_unique` UNIQUE(`transactionCode`),
	CONSTRAINT `reward_transactions_pickup_idx` UNIQUE(`pickupId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `waste_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pickupId` int NOT NULL,
	`imageUrl` text,
	`imageKey` varchar(500),
	`detectedMaterial` varchar(160),
	`aiConfidence` decimal(5,2),
	`aiNotes` text,
	`estimatedWeight` decimal(10,2) NOT NULL,
	`contaminationEstimate` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `waste_submissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `waste_submissions_pickup_idx` UNIQUE(`pickupId`)
);
--> statement-breakpoint
CREATE INDEX `chain_events_pickup_idx` ON `chain_of_custody_events` (`pickupId`);--> statement-breakpoint
CREATE INDEX `chain_events_type_idx` ON `chain_of_custody_events` (`eventType`);--> statement-breakpoint
CREATE INDEX `pickup_requests_generator_idx` ON `pickup_requests` (`generatorId`);--> statement-breakpoint
CREATE INDEX `pickup_requests_status_idx` ON `pickup_requests` (`status`);--> statement-breakpoint
CREATE INDEX `reward_transactions_generator_idx` ON `reward_transactions` (`generatorId`);