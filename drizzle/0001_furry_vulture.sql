CREATE TABLE `analytics_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`carrier` varchar(50) NOT NULL,
	`totalTests` int NOT NULL DEFAULT 0,
	`successCount` int NOT NULL DEFAULT 0,
	`failureCount` int NOT NULL DEFAULT 0,
	`averageLatency` decimal(10,2),
	`averageBandwidth` decimal(10,2),
	`successRate` decimal(5,2),
	`bestSNI` varchar(255),
	`bestPayloadMethod` varchar(50),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analytics_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connection_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`carrier` varchar(50) NOT NULL,
	`server` varchar(255) NOT NULL,
	`sni` varchar(255) NOT NULL,
	`payloadMethod` varchar(50) NOT NULL,
	`status` enum('connected','disconnected','failed') NOT NULL,
	`duration` int,
	`ipAddress` varchar(45),
	`connectionDate` timestamp NOT NULL DEFAULT (now()),
	`disconnectionDate` timestamp,
	CONSTRAINT `connection_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connection_test_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`carrier` varchar(50) NOT NULL,
	`server` varchar(255) NOT NULL,
	`sni` varchar(255) NOT NULL,
	`payloadMethod` varchar(50) NOT NULL,
	`status` enum('success','failed','timeout') NOT NULL,
	`latency` int,
	`bandwidth` decimal(10,2),
	`errorMessage` text,
	`duration` int NOT NULL,
	`testDate` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `connection_test_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vpn_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`carrier` varchar(50) NOT NULL,
	`server` varchar(255) NOT NULL,
	`sni` varchar(255) NOT NULL,
	`payloadMethod` varchar(50) NOT NULL,
	`protocol` varchar(50) NOT NULL,
	`isDefault` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vpn_configurations_id` PRIMARY KEY(`id`)
);
