-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: ubuntu_smart_mart
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_log` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `module` varchar(50) DEFAULT NULL,
  `target_table` varchar(60) DEFAULT NULL,
  `target_id` int(10) unsigned DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,2,'CREATE','products','products',1,NULL,NULL,'127.0.0.1','2026-05-08 08:15:30'),(2,2,'UPDATE','products','products',11,NULL,NULL,'127.0.0.1','2026-06-06 08:15:30'),(3,1,'CREATE','users','users',2,NULL,NULL,'127.0.0.1','2026-05-13 08:15:30'),(4,2,'CREATE','purchase_orders','purchase_orders',3,NULL,NULL,'127.0.0.1','2026-06-01 08:15:30'),(5,1,'UPDATE','purchase_orders','purchase_orders',3,NULL,NULL,'127.0.0.1','2026-06-02 08:15:30'),(6,3,'CREATE','sales','sales',1,NULL,NULL,'127.0.0.1','2026-06-07 08:15:30'),(7,1,'CREATE','users','users',7,NULL,'{\"full_name\":\"Simesihle\",\"username\":\"Sitole\",\"role\":\"cashier\"}','::1','2026-06-07 08:22:05'),(8,1,'DELETE','users','users',4,NULL,NULL,'::1','2026-06-07 08:24:49'),(9,1,'BACKUP','backup_log','backup_log',3,NULL,'{\"filename\":\"ubuntu_smart_mart_2026-06-07_103156.sql\",\"status\":\"success\"}','::1','2026-06-07 08:31:58'),(10,2,'ADJUST','stock_movements','stock_movements',2,'{\"stock_qty\":38}','{\"stock_qty\":43}','::1','2026-06-07 08:43:27'),(11,2,'ADJUST','stock_movements','stock_movements',1,'{\"stock_qty\":45}','{\"stock_qty\":35}','::1','2026-06-07 08:44:38'),(12,2,'UPDATE','purchase_orders','purchase_orders',1,'{\"po_id\":1,\"po_ref\":\"PO-20260601-001\",\"supplier_id\":1,\"created_by\":2,\"approved_by\":null,\"status\":\"draft\",\"total_amt\":\"1250.00\",\"expected_date\":\"2026-06-14\",\"received_date\":null,\"notes\":\"Weekly bread restock\",\"supplier_notes\":null,\"created_at\":\"2026-06-05 10:15:30\",\"updated_at\":\"2026-06-07 10:15:30\"}','{\"supplier_id\":1,\"expected_date\":\"2026-06-14\",\"notes\":\"Weekly bread restock\",\"items\":[{\"product_id\":1,\"qty_ordered\":20,\"unit_cost\":12.5,\"line_total\":250},{\"product_id\":2,\"qty_ordered\":27,\"unit_cost\":12.5,\"line_total\":337.5}]}','::1','2026-06-07 08:48:57'),(13,2,'UPDATE','purchase_orders','purchase_orders',2,'{\"po_id\":2,\"po_ref\":\"PO-20260601-002\",\"supplier_id\":2,\"created_by\":2,\"approved_by\":1,\"status\":\"submitted\",\"total_amt\":\"2840.00\",\"expected_date\":\"2026-06-12\",\"received_date\":null,\"notes\":\"Dairy monthly order\",\"supplier_notes\":null,\"created_at\":\"2026-06-03 10:15:30\",\"updated_at\":\"2026-06-07 10:15:30\"}','{\"supplier_id\":3,\"expected_date\":\"2026-06-12\",\"notes\":\"Dairy monthly order\",\"items\":[{\"product_id\":3,\"qty_ordered\":40,\"unit_cost\":22,\"line_total\":880},{\"product_id\":4,\"qty_ordered\":30,\"unit_cost\":28,\"line_total\":840},{\"product_id\":5,\"qty_ordered\":20,\"unit_cost\":45,\"line_total\":900},{\"product_id\":3,\"qty_ordered\":10,\"unit_cost\":22,\"line_total\":220}]}','::1','2026-06-07 08:51:58'),(14,2,'UPDATE','purchase_orders','purchase_orders',1,'{\"po_id\":1,\"po_ref\":\"PO-20260601-001\",\"supplier_id\":1,\"created_by\":2,\"approved_by\":null,\"status\":\"draft\",\"total_amt\":\"587.50\",\"expected_date\":\"2026-06-14\",\"received_date\":null,\"notes\":\"Weekly bread restock\",\"supplier_notes\":null,\"created_at\":\"2026-06-05 10:15:30\",\"updated_at\":\"2026-06-07 10:48:57\"}','{\"supplier_id\":3,\"expected_date\":\"2026-06-14\",\"notes\":\"Weekly bread restock\",\"items\":[{\"product_id\":1,\"qty_ordered\":20,\"unit_cost\":12.5,\"line_total\":250},{\"product_id\":2,\"qty_ordered\":27,\"unit_cost\":12.5,\"line_total\":337.5}]}','::1','2026-06-07 08:52:31'),(15,2,'CREATE','purchase_orders','purchase_orders',6,NULL,'{\"po_ref\":\"PO-20260607-0001\"}','::1','2026-06-07 08:57:09'),(16,3,'CREATE','sales','sales',7,NULL,'{\"sale_ref\":\"USM-20260607-0002\",\"total_amt\":44.83}','::1','2026-06-07 09:02:17'),(17,3,'CREATE','sales','sales',8,NULL,'{\"sale_ref\":\"USM-20260607-0003\",\"total_amt\":21.84}','::1','2026-06-07 09:03:06'),(18,5,'CREATE','sales','sales',9,NULL,'{\"sale_ref\":\"USM-20260607-0004\",\"status\":\"pending\",\"online\":true}','::1','2026-06-07 09:43:13'),(19,3,'DISPATCH','sales','sales',9,'{\"sale_id\":9,\"sale_ref\":\"USM-20260607-0004\",\"cashier_id\":null,\"customer_id\":2,\"subtotal\":\"36.99\",\"discount_amt\":\"0.00\",\"tax_amt\":\"5.55\",\"total_amt\":\"42.54\",\"amount_paid\":\"0.00\",\"change_given\":\"0.00\",\"payment_method\":\"card\",\"status\":\"pending\",\"points_earned\":0,\"points_redeemed\":0,\"notes\":null,\"delivery_address\":\"22 Umlazi Section V, Durban, KZN 4031\",\"delivery_phone\":\"085 444 5566\",\"delivered_at\":null,\"created_at\":\"2026-06-07 11:43:13\"}','{\"status\":\"out_for_delivery\"}','::1','2026-06-07 09:44:12'),(20,3,'DELIVER','sales','sales',9,'{\"sale_id\":9,\"sale_ref\":\"USM-20260607-0004\",\"cashier_id\":3,\"customer_id\":2,\"subtotal\":\"36.99\",\"discount_amt\":\"0.00\",\"tax_amt\":\"5.55\",\"total_amt\":\"42.54\",\"amount_paid\":\"0.00\",\"change_given\":\"0.00\",\"payment_method\":\"card\",\"status\":\"out_for_delivery\",\"points_earned\":0,\"points_redeemed\":0,\"notes\":null,\"delivery_address\":\"22 Umlazi Section V, Durban, KZN 4031\",\"delivery_phone\":\"085 444 5566\",\"delivered_at\":null,\"created_at\":\"2026-06-07 11:43:13\"}','{\"status\":\"delivered\"}','::1','2026-06-07 09:44:20');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_log`
--

DROP TABLE IF EXISTS `backup_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `backup_log` (
  `backup_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_by` int(10) unsigned NOT NULL,
  `filename` varchar(255) NOT NULL,
  `size_bytes` bigint(20) DEFAULT NULL,
  `status` enum('success','failed') NOT NULL DEFAULT 'success',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`backup_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `backup_log_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_log`
--

LOCK TABLES `backup_log` WRITE;
/*!40000 ALTER TABLE `backup_log` DISABLE KEYS */;
INSERT INTO `backup_log` VALUES (1,1,'ubuntu_smart_mart_20260528.sql',245760,'success','2026-05-28 08:15:30'),(2,1,'ubuntu_smart_mart_20260601.sql',251904,'success','2026-06-01 08:15:30'),(3,1,'ubuntu_smart_mart_2026-06-07_103156.sql',32789,'success','2026-06-07 08:31:58');
/*!40000 ALTER TABLE `backup_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `category_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(80) NOT NULL,
  `slug` varchar(80) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Bread & Bakery','bread-bakery','Croissant',1,1,'2026-06-07 08:08:05'),(2,'Dairy & Eggs','dairy-eggs','Milk',2,1,'2026-06-07 08:08:05'),(3,'Beverages','beverages','GlassWater',3,1,'2026-06-07 08:08:05'),(4,'Snacks','snacks','Candy',4,1,'2026-06-07 08:08:05'),(5,'Household Goods','household','Sparkles',5,1,'2026-06-07 08:08:05'),(6,'Canned & Dry Goods','canned-dry','Package',6,1,'2026-06-07 08:08:05'),(7,'Frozen Foods','frozen','Snowflake',7,1,'2026-06-07 08:08:05'),(8,'Fresh Produce','fresh-produce','Leaf',8,1,'2026-06-07 08:08:05');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `customer_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `address` text DEFAULT NULL,
  `loyalty_points` int(11) NOT NULL DEFAULT 0,
  `loyalty_tier` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
  `total_spent` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,4,'14 Chesterville Rd, Durban, KZN 4091',850,'silver',4250.00,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(2,5,'22 Umlazi Section V, Durban, KZN 4031',3242,'gold',18242.54,'2026-06-07 08:15:30','2026-06-07 09:44:20');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `expenses` (
  `expense_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `recorded_by` int(10) unsigned NOT NULL,
  `category` varchar(80) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `expense_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`expense_id`),
  KEY `recorded_by` (`recorded_by`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,2,'Utilities',4500.00,'Electricity — May 2026','2026-06-02','2026-06-07 08:15:30'),(2,2,'Rent',18000.00,'Shop rental — June 2026','2026-06-07','2026-06-07 08:15:30'),(3,2,'Staff',8500.00,'Casual staff — weekend cover','2026-06-04','2026-06-07 08:15:30'),(4,1,'Maintenance',1200.00,'Fridge compressor repair','2026-05-28','2026-06-07 08:15:30'),(5,2,'Transport',850.00,'Delivery vehicle fuel','2026-06-05','2026-06-07 08:15:30');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `notif_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notif_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,'low_stock','Low Stock Alert','Lays Classic 150g is down to 4 units (reorder: 15).','{\"product_id\":11}',1,'2026-06-07 07:15:30'),(2,1,'low_stock','Out of Stock','Spekko Sugar Beans 500g is out of stock.','{\"product_id\":16}',1,'2026-06-07 06:15:30'),(3,2,'low_stock','Low Stock Alert','Tomatoes per kg — only 3 kg remaining.','{\"product_id\":20}',0,'2026-06-07 05:15:30'),(4,2,'purchase','PO Approved','PO-20260601-003 approved — snacks order.','{\"po_id\":3}',1,'2026-06-06 08:15:30'),(5,6,'purchase','New Purchase Order','PO-20260601-003 awaiting shipment.','{\"po_id\":3}',0,'2026-06-01 08:15:30'),(6,6,'purchase','Shipment Requested','PO-20260525-004 marked for delivery.','{\"po_id\":4}',0,'2026-06-05 08:15:30'),(7,3,'sale','Daily Target Met','Great work! 110+ sales today.',NULL,1,'2026-06-07 04:15:30'),(8,5,'delivery','Order Out for Delivery','Your order USM-20260607-0004 is on its way to you.','{\"sale_id\":9,\"sale_ref\":\"USM-20260607-0004\"}',0,'2026-06-07 09:44:12'),(9,5,'delivery','Order Delivered','Your order USM-20260607-0004 has been delivered. Thank you for shopping with us!','{\"sale_id\":9,\"sale_ref\":\"USM-20260607-0004\"}',0,'2026-06-07 09:44:20');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `po_items`
--

DROP TABLE IF EXISTS `po_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `po_items` (
  `po_item_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `po_id` int(10) unsigned NOT NULL,
  `product_id` int(10) unsigned NOT NULL,
  `qty_ordered` int(11) NOT NULL DEFAULT 1,
  `qty_received` int(11) NOT NULL DEFAULT 0,
  `unit_cost` decimal(10,2) NOT NULL,
  `line_total` decimal(10,2) NOT NULL,
  PRIMARY KEY (`po_item_id`),
  KEY `po_id` (`po_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `po_items_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`po_id`) ON DELETE CASCADE,
  CONSTRAINT `po_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `po_items`
--

LOCK TABLES `po_items` WRITE;
/*!40000 ALTER TABLE `po_items` DISABLE KEYS */;
INSERT INTO `po_items` VALUES (7,3,6,30,0,18.00,540.00),(8,3,9,40,0,8.50,340.00),(9,3,10,40,0,9.00,360.00),(10,3,7,20,0,24.00,480.00),(11,4,1,40,0,12.50,500.00),(12,4,14,30,0,9.50,285.00),(13,4,15,10,0,28.00,280.00),(14,5,3,50,50,22.00,1100.00),(15,5,4,25,25,28.00,700.00),(16,5,5,20,20,45.00,900.00),(17,5,3,20,20,22.00,440.00),(20,2,3,40,0,22.00,880.00),(21,2,4,30,0,28.00,840.00),(22,2,5,20,0,45.00,900.00),(23,2,3,10,0,22.00,220.00),(24,1,1,20,0,12.50,250.00),(25,1,2,27,0,12.50,337.50),(26,6,2,15,0,13.00,195.00),(27,6,1,15,0,12.50,187.50);
/*!40000 ALTER TABLE `po_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `product_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int(10) unsigned NOT NULL,
  `supplier_id` int(10) unsigned DEFAULT NULL,
  `barcode` varchar(60) DEFAULT NULL,
  `sku` varchar(60) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `unit` varchar(30) NOT NULL DEFAULT 'each',
  `cost_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `selling_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock_qty` int(11) NOT NULL DEFAULT 0,
  `reorder_level` int(11) NOT NULL DEFAULT 5,
  `max_stock` int(11) NOT NULL DEFAULT 100,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `barcode` (`barcode`),
  UNIQUE KEY `sku` (`sku`),
  KEY `category_id` (`category_id`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`),
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,1,1,'6001060000011','BRD-001','Albany Superior White Bread 700g','Fresh white loaf',NULL,'each',12.50,18.99,33,20,80,1,1,'2026-06-07 08:15:30','2026-06-07 09:03:06'),(2,1,1,'6001060000028','BRD-002','Albany Brown Bread 700g','High-fibre brown loaf',NULL,'each',13.00,19.99,42,20,80,1,0,'2026-06-07 08:15:30','2026-06-07 09:02:17'),(3,2,2,'6001061000015','DRY-001','Clover Full Cream Milk 2L','Fresh full cream milk',NULL,'each',22.00,32.99,60,15,100,1,1,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(4,2,2,'6001061000022','DRY-002','Clover Cheddar Cheese 250g','Mature cheddar block',NULL,'each',28.00,42.99,25,10,50,1,0,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(5,2,2,'6001061000039','DRY-003','Large Eggs 18-pack','Grade A eggs',NULL,'pack',45.00,64.99,30,10,60,1,1,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(6,3,3,'6001062000012','BEV-001','Coca-Cola 2L','Original taste',NULL,'each',18.00,27.99,55,20,100,1,1,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(7,3,3,'6001062000029','BEV-002','Oros Orange Squash 2L','Concentrated squash',NULL,'each',24.00,36.99,39,15,80,1,0,'2026-06-07 08:15:30','2026-06-07 09:44:12'),(8,3,1,'6001062000036','BEV-003','Valpre Still Water 5L','Purified still water',NULL,'each',15.00,22.99,70,20,120,1,0,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(9,4,3,'6001063000013','SNK-001','Simba Chips Salt & Vinegar 125g','Crispy potato chips',NULL,'each',8.50,14.99,80,25,150,1,1,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(10,4,3,'6001063000020','SNK-002','Cadbury Dairy Milk 80g','Milk chocolate bar',NULL,'each',9.00,16.99,65,20,120,1,0,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(11,4,3,'6001063000037','SNK-003','Lays Classic 150g','Original potato chips',NULL,'each',10.00,18.99,4,15,100,1,0,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(12,5,1,'6001064000014','HSH-001','Sunlight Dishwashing Liquid 750ml','Lemon fresh',NULL,'each',18.00,28.99,35,10,60,1,0,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(13,5,1,'6001064000021','HSH-002','Domestos Thick Bleach 750ml','Hospital-grade clean',NULL,'each',22.00,34.99,28,10,50,1,0,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(14,6,1,'6001065000015','CND-001','Koo Baked Beans in Tomato 410g','Baked beans',NULL,'each',9.50,15.99,50,15,100,1,0,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(15,6,1,'6001065000022','CND-002','Tastic Rice 2kg','Long-grain white rice',NULL,'each',28.00,42.99,42,15,80,1,1,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(16,6,1,'6001065000039','CND-003','Spekko Sugar Beans 500g','Dried sugar beans',NULL,'each',16.00,24.99,0,10,60,1,0,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(17,7,1,'6001066000016','FRZ-001','McCain Frozen Chips 1kg','Straight cut chips',NULL,'each',32.00,49.99,22,10,50,1,0,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(18,7,1,'6001066000023','FRZ-002','I&J Hake Fillets 800g','Frozen hake portions',NULL,'each',55.00,79.99,18,8,40,1,0,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(19,8,1,'6001067000017','PRD-001','Bananas per kg','Fresh bananas',NULL,'kg',8.00,14.99,35,10,80,1,1,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(20,8,1,'6001067000024','PRD-002','Tomatoes per kg','Ripe salad tomatoes',NULL,'kg',12.00,19.99,3,10,50,1,0,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(21,8,1,'6001067000031','PRD-003','Onions per kg','Brown onions',NULL,'kg',7.00,12.99,50,15,100,1,0,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(22,8,1,'6001067000048','PRD-004','Spinach bunch','Fresh spinach bunch',NULL,'each',5.00,9.99,20,8,40,1,0,'2026-06-07 08:15:30','2026-06-07 08:15:30');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_orders` (
  `po_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `po_ref` varchar(20) NOT NULL,
  `supplier_id` int(10) unsigned NOT NULL,
  `created_by` int(10) unsigned NOT NULL,
  `approved_by` int(10) unsigned DEFAULT NULL,
  `status` enum('draft','submitted','approved','shipped','received','cancelled') NOT NULL DEFAULT 'draft',
  `total_amt` decimal(10,2) NOT NULL DEFAULT 0.00,
  `expected_date` date DEFAULT NULL,
  `received_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `supplier_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`po_id`),
  UNIQUE KEY `po_ref` (`po_ref`),
  KEY `supplier_id` (`supplier_id`),
  KEY `created_by` (`created_by`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`),
  CONSTRAINT `purchase_orders_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `purchase_orders_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES (1,'PO-20260601-001',1,2,NULL,'draft',587.50,'2026-06-14',NULL,'Weekly bread restock',NULL,'2026-06-05 08:15:30','2026-06-07 08:48:57'),(2,'PO-20260601-002',2,2,1,'submitted',2840.00,'2026-06-12',NULL,'Dairy monthly order',NULL,'2026-06-03 08:15:30','2026-06-07 08:15:30'),(3,'PO-20260601-003',3,2,1,'approved',1720.00,'2026-06-10',NULL,'Snacks & beverages',NULL,'2026-06-01 08:15:30','2026-06-07 08:15:30'),(4,'PO-20260525-004',1,2,1,'shipped',1065.00,'2026-06-05',NULL,'Awaiting delivery',NULL,'2026-05-28 08:15:30','2026-06-07 08:15:30'),(5,'PO-20260520-005',2,2,1,'received',3140.00,'2026-05-24','2026-05-31','Received in full',NULL,'2026-05-23 08:15:30','2026-06-07 08:15:30'),(6,'PO-20260607-0001',1,2,NULL,'draft',382.50,'2026-06-12',NULL,'Bread',NULL,'2026-06-07 08:57:09','2026-06-07 08:57:09');
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sale_items` (
  `item_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` int(10) unsigned NOT NULL,
  `product_id` int(10) unsigned NOT NULL,
  `qty` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `discount_pct` decimal(5,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(10,2) NOT NULL,
  PRIMARY KEY (`item_id`),
  KEY `sale_id` (`sale_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`sale_id`) ON DELETE CASCADE,
  CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES (1,1,1,2,18.99,0.00,37.98),(2,1,3,1,32.99,0.00,32.99),(3,1,9,1,14.99,0.00,14.99),(4,1,6,1,27.99,0.00,27.99),(5,2,15,2,42.99,0.00,85.98),(6,2,17,1,49.99,0.00,49.99),(7,2,19,2,14.99,0.00,29.98),(8,2,4,1,42.99,0.00,42.99),(9,3,6,1,27.99,0.00,27.99),(10,3,9,2,14.99,0.00,29.98),(11,3,8,1,22.99,0.00,22.99),(12,4,2,2,19.99,0.00,39.98),(13,4,5,1,64.99,0.00,64.99),(14,4,10,2,16.99,0.00,33.98),(15,4,21,1,12.99,0.00,12.99),(16,5,18,2,79.99,0.00,159.98),(17,5,3,2,32.99,0.00,65.98),(18,5,13,1,34.99,0.00,34.99),(19,6,1,1,18.99,0.00,18.99),(20,7,1,1,18.99,0.00,18.99),(21,7,2,1,19.99,0.00,19.99),(22,8,1,1,18.99,0.00,18.99),(23,9,7,1,36.99,0.00,36.99);
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales` (
  `sale_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sale_ref` varchar(20) NOT NULL,
  `cashier_id` int(10) unsigned DEFAULT NULL,
  `customer_id` int(10) unsigned DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amt` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amt` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amt` decimal(10,2) NOT NULL DEFAULT 0.00,
  `amount_paid` decimal(10,2) NOT NULL DEFAULT 0.00,
  `change_given` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` enum('cash','card','ewallet','loyalty') NOT NULL DEFAULT 'cash',
  `status` enum('completed','voided','refunded','pending','out_for_delivery','delivered') NOT NULL DEFAULT 'completed',
  `points_earned` int(11) NOT NULL DEFAULT 0,
  `points_redeemed` int(11) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `delivery_address` text DEFAULT NULL,
  `delivery_phone` varchar(30) DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`sale_id`),
  UNIQUE KEY `sale_ref` (`sale_ref`),
  KEY `cashier_id` (`cashier_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES (1,'USM-SEED-0001',3,1,95.95,0.00,14.39,110.34,120.00,9.66,'cash','completed',110,0,NULL,NULL,NULL,NULL,'2026-06-07 08:15:30'),(2,'USM-SEED-0002',3,2,187.93,10.00,26.69,204.62,204.62,0.00,'card','completed',204,0,NULL,NULL,NULL,NULL,'2026-06-06 08:15:30'),(3,'USM-SEED-0003',3,NULL,64.96,0.00,9.74,74.70,100.00,25.30,'cash','completed',0,0,NULL,NULL,NULL,NULL,'2026-06-05 08:15:30'),(4,'USM-SEED-0004',3,1,142.92,5.00,20.69,158.61,158.61,0.00,'ewallet','completed',158,0,NULL,NULL,NULL,NULL,'2026-06-04 08:15:30'),(5,'USM-SEED-0005',3,2,259.88,0.00,38.98,298.86,300.00,1.14,'cash','completed',298,0,NULL,NULL,NULL,NULL,'2026-06-02 08:15:30'),(6,'USM-SEED-0006',3,NULL,18.99,0.00,2.85,21.84,21.84,0.00,'cash','voided',0,0,NULL,NULL,NULL,NULL,'2026-05-31 08:15:30'),(7,'USM-20260607-0002',3,NULL,38.98,0.00,5.85,44.83,44.83,0.00,'cash','completed',44,0,NULL,NULL,NULL,NULL,'2026-06-07 09:02:17'),(8,'USM-20260607-0003',3,NULL,18.99,0.00,2.85,21.84,21.84,0.00,'cash','completed',21,0,NULL,NULL,NULL,NULL,'2026-06-07 09:03:06'),(9,'USM-20260607-0004',3,2,36.99,0.00,5.55,42.54,42.54,0.00,'card','delivered',42,0,NULL,'22 Umlazi Section V, Durban, KZN 4031','085 444 5566','2026-06-07 09:44:20','2026-06-07 09:43:13');
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_movements` (
  `movement_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `movement_type` enum('sale','purchase','adjustment','return','damage','opening') NOT NULL,
  `reference_id` int(10) unsigned DEFAULT NULL,
  `qty_before` int(11) NOT NULL,
  `qty_change` int(11) NOT NULL,
  `qty_after` int(11) NOT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`movement_id`),
  KEY `product_id` (`product_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`),
  CONSTRAINT `stock_movements_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES (1,1,2,'opening',NULL,0,45,45,'Seed opening stock','2026-05-08 08:15:30'),(2,2,2,'opening',NULL,0,38,38,'Seed opening stock','2026-05-08 08:15:30'),(3,3,2,'opening',NULL,0,60,60,'Seed opening stock','2026-05-08 08:15:30'),(4,4,2,'opening',NULL,0,25,25,'Seed opening stock','2026-05-08 08:15:30'),(5,5,2,'opening',NULL,0,30,30,'Seed opening stock','2026-05-08 08:15:30'),(6,6,2,'opening',NULL,0,55,55,'Seed opening stock','2026-05-08 08:15:30'),(7,7,2,'opening',NULL,0,40,40,'Seed opening stock','2026-05-08 08:15:30'),(8,8,2,'opening',NULL,0,70,70,'Seed opening stock','2026-05-08 08:15:30'),(9,9,2,'opening',NULL,0,80,80,'Seed opening stock','2026-05-08 08:15:30'),(10,10,2,'opening',NULL,0,65,65,'Seed opening stock','2026-05-08 08:15:30'),(11,11,2,'opening',NULL,0,4,4,'Seed opening stock','2026-05-08 08:15:30'),(12,12,2,'opening',NULL,0,35,35,'Seed opening stock','2026-05-08 08:15:30'),(13,13,2,'opening',NULL,0,28,28,'Seed opening stock','2026-05-08 08:15:30'),(14,14,2,'opening',NULL,0,50,50,'Seed opening stock','2026-05-08 08:15:30'),(15,15,2,'opening',NULL,0,42,42,'Seed opening stock','2026-05-08 08:15:30'),(16,16,2,'opening',NULL,0,0,0,'Seed opening stock','2026-05-08 08:15:30'),(17,17,2,'opening',NULL,0,22,22,'Seed opening stock','2026-05-08 08:15:30'),(18,18,2,'opening',NULL,0,18,18,'Seed opening stock','2026-05-08 08:15:30'),(19,19,2,'opening',NULL,0,35,35,'Seed opening stock','2026-05-08 08:15:30'),(20,20,2,'opening',NULL,0,3,3,'Seed opening stock','2026-05-08 08:15:30'),(21,21,2,'opening',NULL,0,50,50,'Seed opening stock','2026-05-08 08:15:30'),(22,22,2,'opening',NULL,0,20,20,'Seed opening stock','2026-05-08 08:15:30'),(32,2,2,'adjustment',NULL,38,5,43,'Manual adjustment','2026-06-07 08:43:27'),(33,1,2,'adjustment',NULL,45,-10,35,'Manual adjustment','2026-06-07 08:44:38'),(34,1,3,'sale',7,35,-1,34,NULL,'2026-06-07 09:02:17'),(35,2,3,'sale',7,43,-1,42,NULL,'2026-06-07 09:02:17'),(36,1,3,'sale',8,34,-1,33,NULL,'2026-06-07 09:03:06'),(37,7,3,'sale',9,40,-1,39,'Delivery dispatch','2026-06-07 09:44:12');
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suppliers` (
  `supplier_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `company_name` varchar(150) NOT NULL,
  `contact_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `tax_number` varchar(50) DEFAULT NULL,
  `payment_terms` varchar(100) DEFAULT NULL,
  `rating` decimal(3,1) DEFAULT 5.0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`supplier_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `suppliers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,6,'Fresh Foods Wholesale','James Pillay','031 555 6677','orders@freshfoods.co.za','45 Industrial Rd, Pinetown, KZN','4123456789','Net 30',4.8,1,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(2,NULL,'KZN Dairy Co-op','Lindiwe Maseko','031 777 8899','sales@kzndairy.co.za','12 Milk Way, Hammarsdale, KZN','4987654321','Net 14',4.5,1,'2026-06-07 08:15:30','2026-06-07 08:15:30'),(3,NULL,'Cape Snacks Distribution','Peter van Wyk','021 888 9900','supply@capasnacks.co.za','8 Warehouse Ln, Cape Town','4011223344','COD',4.2,1,'2026-06-07 08:15:30','2026-06-07 08:15:30');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','manager','cashier','customer','supplier') NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'System Admin','admin','admin@usmart.co.za',NULL,'$2y$12$XsyFtDO1VyDE6DXl.dJ8XOyqYA/YrSjWE8bqbZ/VxKc9HiNT.D52K','admin',NULL,1,'2026-06-10 14:14:47','2026-06-07 08:08:05','2026-06-10 14:14:47'),(2,'Thabo Mthembu','thabo.m','thabo@usmart.co.za','082 111 2233','$2y$12$XsyFtDO1VyDE6DXl.dJ8XOyqYA/YrSjWE8bqbZ/VxKc9HiNT.D52K','manager',NULL,1,'2026-06-07 08:42:38','2026-06-07 08:15:30','2026-06-07 08:42:38'),(3,'Zanele Khumalo','zanele.k','zanele@usmart.co.za','083 222 3344','$2y$12$XsyFtDO1VyDE6DXl.dJ8XOyqYA/YrSjWE8bqbZ/VxKc9HiNT.D52K','cashier',NULL,1,'2026-06-07 09:44:04','2026-06-07 08:15:30','2026-06-07 09:44:04'),(4,'Sipho Nkosi','sipho.n','sipho@example.co.za','084 333 4455','$2y$12$XsyFtDO1VyDE6DXl.dJ8XOyqYA/YrSjWE8bqbZ/VxKc9HiNT.D52K','customer',NULL,0,'2026-06-04 08:15:30','2026-06-07 08:15:30','2026-06-07 08:24:49'),(5,'Nomsa Dlamini','nomsa.d','nomsa@example.co.za','085 444 5566','$2y$12$XsyFtDO1VyDE6DXl.dJ8XOyqYA/YrSjWE8bqbZ/VxKc9HiNT.D52K','customer',NULL,1,'2026-06-07 09:44:38','2026-06-07 08:15:30','2026-06-07 09:44:38'),(6,'Fresh Foods Co','freshfoods','orders@freshfoods.co.za','031 555 6677','$2y$12$XsyFtDO1VyDE6DXl.dJ8XOyqYA/YrSjWE8bqbZ/VxKc9HiNT.D52K','supplier',NULL,1,'2026-06-07 09:26:29','2026-06-07 08:15:30','2026-06-07 09:26:29'),(7,'Simesihle','Sitole','simesihlem@smartmart.com','0658547963','$2y$12$9DhdlNZ.rkcBW11VIN56o.y7/N0TWFAFzWhWFbltn0lNhs19ByXZK','cashier',NULL,1,'2026-06-07 08:22:49','2026-06-07 08:22:05','2026-06-07 08:22:49');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-10 16:16:10
