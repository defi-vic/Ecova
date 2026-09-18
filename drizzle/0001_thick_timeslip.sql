ALTER TABLE `generator_profiles` ADD `isDemo` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `pickup_requests` ADD `isDemo` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `chain_of_custody_events` ADD CONSTRAINT `chain_events_pickup_type_idx` UNIQUE(`pickupId`,`eventType`);--> statement-breakpoint
CREATE INDEX `pickup_requests_collector_idx` ON `pickup_requests` (`collectorId`);