CREATE TABLE `activity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`actorId` int,
	`action` varchar(255) NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`assigneeId` int NOT NULL,
	`role` enum('sales','engineering','pricing','manager') NOT NULL,
	`status` enum('open','completed','overdue') NOT NULL DEFAULT 'open',
	`dueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clarifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`status` enum('draft','sent','resolved','cancelled') NOT NULL DEFAULT 'draft',
	`assigneeId` int,
	`sentAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clarifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`contactName` varchar(255),
	`email` varchar(320),
	`phone` varchar(64),
	`address` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`rfqId` int,
	`type` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`rfqItemId` int,
	`description` text NOT NULL,
	`quantity` decimal(14,3) NOT NULL,
	`unitPrice` decimal(14,2) NOT NULL,
	`lineTotal` decimal(14,2) NOT NULL,
	CONSTRAINT `quote_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`quoteNumber` varchar(64) NOT NULL,
	`status` enum('draft','ready','sent','won','lost') NOT NULL DEFAULT 'draft',
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`discount` decimal(14,2) DEFAULT '0',
	`tax` decimal(14,2) DEFAULT '0',
	`shipping` decimal(14,2) DEFAULT '0',
	`subtotal` decimal(14,2) DEFAULT '0',
	`grandTotal` decimal(14,2) DEFAULT '0',
	`leadTime` varchar(128),
	`validityDays` int,
	`paymentTerms` varchar(128),
	`notes` text,
	`documentKey` varchar(512),
	`documentUrl` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotes_quoteNumber_unique` UNIQUE(`quoteNumber`)
);
--> statement-breakpoint
CREATE TABLE `rfq_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(128),
	`sizeBytes` int,
	`documentType` varchar(64) DEFAULT 'rfq',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rfq_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfq_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`sku` varchar(128),
	`productName` varchar(255) NOT NULL,
	`description` text,
	`quantity` decimal(14,3),
	`unit` varchar(32),
	`dimensions` varchar(255),
	`material` varchar(255),
	`grade` varchar(128),
	`specifications` text,
	`certifications` text,
	`deliveryRequirements` text,
	`specialRequirements` text,
	`confidence` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rfq_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfq_requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`label` varchar(255) NOT NULL,
	`status` enum('approved','missing','exception') NOT NULL DEFAULT 'missing',
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rfq_requirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqNumber` varchar(64) NOT NULL,
	`customerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` enum('NEW','PROCESSING','REVIEW_REQUIRED','WAITING_FOR_INFORMATION','READY_FOR_QUOTE','QUOTED','WON','LOST') NOT NULL DEFAULT 'NEW',
	`priority` enum('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
	`risk` enum('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'LOW',
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`deadline` timestamp,
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`deliveryLocation` text,
	`paymentTerms` varchar(128),
	`incoterms` varchar(64),
	`estimatedValue` decimal(14,2),
	`assignedUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rfqs_id` PRIMARY KEY(`id`),
	CONSTRAINT `rfqs_rfqNumber_unique` UNIQUE(`rfqNumber`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`assigneeId` int,
	`label` varchar(255) NOT NULL,
	`status` enum('open','completed','overdue') NOT NULL DEFAULT 'open',
	`dueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
