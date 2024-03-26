-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 26, 2024 at 06:24 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `MedInsCareDB`
--

-- --------------------------------------------------------

--
-- Table structure for table `Bills`
--

CREATE TABLE `Bills` (
  `billId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `costsExplained` varchar(2000) DEFAULT NULL,
  `totalAmount` varchar(10) NOT NULL,
  `isCancelled` int(11) DEFAULT 0,
  `isPaid` int(11) NOT NULL DEFAULT 0,
  `generatedDate` datetime DEFAULT current_timestamp(),
  `cancelledDate` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Bills`
--

INSERT INTO `Bills` (`billId`, `patientId`, `hospitalId`, `costsExplained`, `totalAmount`, `isCancelled`, `isPaid`, `generatedDate`, `cancelledDate`) VALUES
(1, 10, 12, 'efewd3d', '1233', 0, 1, '2024-03-17 21:12:22', NULL),
(2, 10, 12, 'r4we343r 3rfkjkefknjf', '50000', 0, 0, '2024-03-17 21:16:29', NULL),
(3, 10, 12, 'dcdewd', '100000', 0, 0, '2024-03-19 09:44:21', NULL),
(4, 10, 12, 'ferf', '1000', 0, 0, '2024-03-19 10:34:20', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `Clients`
--

CREATE TABLE `Clients` (
  `clientId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `clientName` varchar(200) NOT NULL,
  `clientProfileImage` varchar(2000) NOT NULL,
  `clientEmail` varchar(200) NOT NULL,
  `hospitalName` varchar(200) NOT NULL,
  `hospitalEmail` varchar(200) NOT NULL,
  `packageId` int(11) NOT NULL,
  `packageTitle` varchar(2000) NOT NULL,
  `packageDetails` varchar(2000) NOT NULL,
  `packageImage` varchar(2000) NOT NULL,
  `packageDuration` varchar(200) NOT NULL,
  `packageAmount` varchar(200) NOT NULL,
  `insuranceProviderId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `isActive` int(11) NOT NULL DEFAULT 1,
  `registeredDate` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Clients`
--

INSERT INTO `Clients` (`clientId`, `patientId`, `clientName`, `clientProfileImage`, `clientEmail`, `hospitalName`, `hospitalEmail`, `packageId`, `packageTitle`, `packageDetails`, `packageImage`, `packageDuration`, `packageAmount`, `insuranceProviderId`, `hospitalId`, `isActive`, `registeredDate`) VALUES
(10, 8, 'Animesh Thomas', 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientProfileImage-1709650928354.jpeg', 'animeshthomas2024@gmail.com', 'Medical Trsut', 'medicaltrusthospital2024@gmail.com', 11, '3edr34e34', '3edfegrfwefr', 'https://medinscare.s3.ap-south-1.amazonaws.com/packageImages/inspmale.jpg', 'ewdwfed', '10000000', 19, 12, 1, '2024-03-17 00:00:08'),
(11, 8, 'Animesh Thomas', 'https://medinscare.s3.ap-south-1.amazonaws.com/patientImages/patientProfile-1710605711827.png', 'animeshthomas2024@gmail.com', 'Medical Trsut', 'medicaltrusthospital2024@gmail.com', 9, 'gfcvhgjchvbhjvghj', 'cfgvhbhyvkhjbyhbjuvykh', 'https://medinscare.s3.ap-south-1.amazonaws.com/packageImages/insurance3.jpeg', 'vhbgh', '12222', 19, 12, 1, '2024-03-17 16:51:53'),
(12, 8, 'Animesh Thomas', 'https://medinscare.s3.ap-south-1.amazonaws.com/patientImages/patientProfile-1710605711827.png', 'animeshthomas2024@gmail.com', 'Medical Trsut', 'medicaltrusthospital2024@gmail.com', 10, 'vgshbjwfvdhb', 'dfedwvrwfedefw', 'https://medinscare.s3.ap-south-1.amazonaws.com/packageImages/inspfemale.jpeg', 'dwefd', '122222', 19, 12, 1, '2024-03-19 10:28:42');

-- --------------------------------------------------------

--
-- Table structure for table `Discharge_Requests`
--

CREATE TABLE `Discharge_Requests` (
  `requestId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `patientName` varchar(50) NOT NULL,
  `patientEmail` varchar(50) NOT NULL,
  `hospitalStaffId` int(11) NOT NULL,
  `hospitalStaffEmail` varchar(50) NOT NULL,
  `message` varchar(2000) DEFAULT NULL,
  `isApproved` int(11) DEFAULT 0,
  `deleteStatus` int(11) NOT NULL DEFAULT 0,
  `sendDate` date DEFAULT curdate(),
  `approvedDate` date DEFAULT NULL,
  `hospitalId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Discharge_Requests`
--

INSERT INTO `Discharge_Requests` (`requestId`, `patientId`, `patientName`, `patientEmail`, `hospitalStaffId`, `hospitalStaffEmail`, `message`, `isApproved`, `deleteStatus`, `sendDate`, `approvedDate`, `hospitalId`) VALUES
(1, 10, '', '', 16, '', 'ssss', 0, 0, '2024-03-05', NULL, 12),
(2, 10, '', '', 16, '', 'wedd3d', 1, 0, '2024-03-16', '2024-03-18', 12),
(3, 10, 'Sebin Jacob', 'sebinjacob2024@gmail.com', 16, 'jaicegeorge2024@gmail.com', 'approve', 1, 0, '2024-03-17', '2024-03-18', 12);

-- --------------------------------------------------------

--
-- Table structure for table `Hospitals`
--

CREATE TABLE `Hospitals` (
  `hospitalId` int(11) NOT NULL,
  `hospitalName` varchar(255) NOT NULL,
  `hospitalEmail` varchar(255) NOT NULL,
  `hospitalAadhar` varchar(50) NOT NULL,
  `hospitalMobile` varchar(50) NOT NULL,
  `hospitalWebSite` varchar(255) NOT NULL,
  `hospitalAddress` varchar(500) NOT NULL,
  `hospitalImage` varchar(2000) NOT NULL,
  `hospitalPassword` varchar(2000) NOT NULL,
  `registeredDate` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedDate` datetime DEFAULT NULL,
  `isActive` int(11) NOT NULL DEFAULT 1,
  `deleteStatus` int(11) NOT NULL DEFAULT 0,
  `updateStatus` int(11) NOT NULL DEFAULT 0,
  `passwordUpdateStatus` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Hospitals`
--

INSERT INTO `Hospitals` (`hospitalId`, `hospitalName`, `hospitalEmail`, `hospitalAadhar`, `hospitalMobile`, `hospitalWebSite`, `hospitalAddress`, `hospitalImage`, `hospitalPassword`, `registeredDate`, `updatedDate`, `isActive`, `deleteStatus`, `updateStatus`, `passwordUpdateStatus`) VALUES
(12, 'Medical Trsut', 'medicaltrusthospital2024@gmail.com', '111111111112', '+918113010619', 'www.hospital.com', 'ascd', 'https://medinscare.s3.ap-south-1.amazonaws.com/hospitalImages/hospitalImage-1709712922200.jpeg', '$2b$10$fYqUWG1DAHnHl6j5utRDvuPH2PbCctejW3BXmyrDNmKecgpXcyrnO', '2024-03-05 18:58:50', '2024-03-16 00:00:00', 1, 0, 1, 0),
(14, 'Libin Jacob', 'libinakaoski@gmail.com', '111111111145', '8113010619', 'www.hospital.com', 'sdcrewsed', 'https://medinscare.s3.ap-south-1.amazonaws.com/hospitalImages/hospitalImage-1709892080109.jpeg', '$2b$10$TIlQyzQA3AxeqASPEhrEIutUrk7BdqdIwkxiDWXPz3CggCJlD5Wm2', '2024-03-08 15:31:20', NULL, 1, 0, 0, 0),
(15, 'Libin Jacob', 'libinakaoski@gmail.co', '111111111555', '8113010619', 'www.hospital.com', 'wdfw', 'https://medinscare.s3.ap-south-1.amazonaws.com/hospitalImages/hospitalImage-1709892914931.jpeg', '$2b$10$J3UafLXf34n6KNdn.an34u/P12n7wmRyzOyz9BhYc0R6tn7Bn6aiO', '2024-03-08 15:45:15', NULL, 1, 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `Hospital_News`
--

CREATE TABLE `Hospital_News` (
  `hospitalNewsId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `hospitalNewsTitle` varchar(500) NOT NULL,
  `hospitalNewsContent` varchar(2000) NOT NULL,
  `hospitalNewsImage` varchar(2000) DEFAULT NULL,
  `addedDate` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedDate` datetime DEFAULT NULL,
  `updateStatus` int(11) NOT NULL DEFAULT 0,
  `deleteStatus` int(11) NOT NULL DEFAULT 0,
  `isHided` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Hospital_News`
--

INSERT INTO `Hospital_News` (`hospitalNewsId`, `hospitalId`, `hospitalNewsTitle`, `hospitalNewsContent`, `hospitalNewsImage`, `addedDate`, `updatedDate`, `updateStatus`, `deleteStatus`, `isHided`) VALUES
(19, 12, 'BREAKING NEWS: Groundbreaking Treatment Shows Promise in Fighting Antibiotic-Resistant Infections', 'In a major breakthrough for the medical industry, researchers have unveiled a promising new treatment for antibiotic-resistant infections. The treatment, known as phage therapy, utilizes viruses called bacteriophages to target and destroy harmful bacteria.\r\n\r\nAntibiotic-resistant infections pose a significant threat to public health worldwide, as conventional antibiotics become less effective against them. In recent years, there has been a growing urgency to find alternative treatments to combat these stubborn infections.\r\n\r\nPhage therapy offers a potential solution by harnessing the power of bacteriophages, which are viruses that specifically infect and kill bacteria. These viruses can be tailored to target specific strains of bacteria, making them a highly targeted and effective treatment option.\r\n\r\nIn a recent clinical trial, researchers tested the efficacy of phage therapy in treating patients with antibiotic-resistant infections, including those caused by methicillin-resistant Staphylococcus aureus (MRSA) and multidrug-resistant Pseudomonas aeruginosa.\r\n\r\n', 'https://medinscare.s3.ap-south-1.amazonaws.com/hospitalNewsImages/virus.jpeg', '2024-03-05 20:03:59', NULL, 0, 0, 0),
(20, 12, 'Breakthrough Study Reveals Potential New Treatment for Alzheimer\'s Disease', 'In a groundbreaking development, researchers at a leading medical institution have unveiled promising findings that could pave the way for a revolutionary treatment for Alzheimer\'s disease. Published in the prestigious Journal of Neuroscience, the study showcases the effectiveness of a novel drug compound in targeting the underlying mechanisms of Alzheimer\'s, offering hope to millions affected by this devastating condition.\r\n\r\nAlzheimer\'s disease, a progressive neurodegenerative disorder, has long posed a formidable challenge to medical science due to its complex pathology and lack of effective treatments. However, this new research signals a significant step forward in the fight against the disease. The experimental drug, designed to inhibit the accumulation of toxic amyloid plaques in the brain, demonstrated remarkable efficacy in preclinical trials, effectively halting cognitive decline and preserving memory function in animal models.', 'https://medinscare.s3.ap-south-1.amazonaws.com/hospitalNewsImages/kerala-covid-2.jpeg', '2024-03-05 20:04:55', NULL, 0, 0, 0),
(21, 12, 'Revolutionary Gene Therapy Shows Promise in Treating Rare Genetic Disorder', 'In a landmark achievement for genetic medicine, scientists have reported unprecedented success in using gene therapy to treat a rare and debilitating genetic disorder known as Duchenne muscular dystrophy (DMD). Published in the prestigious journal Science Translational Medicine, the study details the remarkable outcomes of a groundbreaking clinical trial that could potentially transform the lives of individuals affected by this devastating condition.\r\n\r\nDuchenne muscular dystrophy, characterized by progressive muscle weakness and degeneration, has long remained a formidable challenge for medical researchers due to its complex genetic underpinnings. However, the new gene therapy approach offers a glimmer of hope for patients and their families. By delivering a functional copy of the defective gene responsible for DMD, researchers were able to restore muscle function and significantly improve motor performance in treated individuals.\r\n\r\nDr. Michael Patel, principal investigator of the study, hailed the results as a major breakthrough in the field of gene therapy, underscoring the transformative potential of this innovative approach. While acknowledging the need for further research to optimize the treatment and address potential safety concerns, Dr. Patel expressed optimism about the prospects of gene therapy as a viable treatment option for DMD.\r\n\r\nThe implications of this pioneering research extend far beyond Duchenne muscular dystrophy, offering a glimpse into the future of precision medicine and gene-based therapies for a wide range of genetic disorders. With continued advancements in gene editing technologies and therapeutic delivery systems, researchers are hopeful that gene therapy could soon become a cornerstone of personalized medicine, offering hope to millions of individuals affected by rare and incurable diseases.', 'https://medinscare.s3.ap-south-1.amazonaws.com/hospitalNewsImages/deadnews.jpeg', '2024-03-05 20:05:43', NULL, 0, 0, 0),
(22, 12, 'Cutting-Edge Imaging Technology Revolutionizes Diagnostic Capabilities in Healthcare', 'In a significant advancement for medical diagnostics, a pioneering imaging technology has been unveiled, promising to revolutionize the way healthcare professionals visualize and diagnose a wide range of conditions. Developed by a team of leading scientists and engineers, the state-of-the-art imaging system combines advanced hardware with sophisticated software algorithms to deliver unparalleled clarity and precision in medical imaging.\r\n\r\nThe new equipment, dubbed \"SpectraVision XE,\" boasts a host of innovative features that set it apart from conventional imaging modalities. Utilizing next-generation sensors and detectors, SpectraVision XE offers enhanced sensitivity and resolution, enabling clinicians to capture detailed images with unprecedented accuracy and fidelity. Furthermore, the system\'s advanced software algorithms leverage artificial intelligence and machine learning to analyze imaging data in real-time, providing clinicians with valuable insights into tissue composition, functionality, and pathology.\r\n\r\nDr. Amanda Nguyen, a radiologist at a leading medical center, lauded the capabilities of SpectraVision XE, noting its potential to transform diagnostic workflows and improve patient outcomes across a wide range of medical specialties. \"The ability to obtain high-resolution, multi-dimensional images in real-time allows us to visualize complex anatomical structures and disease processes with remarkable clarity,\" remarked Dr. Nguyen. \"This not only enhances our diagnostic accuracy but also facilitates personalized treatment planning and monitoring.\"\r\n\r\nThe versatility of SpectraVision XE extends beyond traditional medical imaging applications, with potential implications for research, education, and surgical guidance. Its compact design and user-friendly interface make it well-suited for use in diverse clinical settings, from hospital radiology departments to outpatient clinics and remote healthcare facilities.\r\n', 'https://medinscare.s3.ap-south-1.amazonaws.com/hospitalNewsImages/newequipmentttt.jpeg', '2024-03-05 20:06:37', NULL, 0, 0, 0),
(23, 12, 'Breakthrough Surgical Procedure Offers Hope for Patients with Inoperable Tumors', 'In a remarkable medical achievement, surgeons have successfully performed a groundbreaking surgical procedure that offers hope to patients with previously deemed inoperable tumors. The innovative technique, known as \"Irreversible Electroporation (IRE),\" utilizes precise electrical pulses to destroy cancerous tissue while preserving surrounding healthy structures, enabling the removal of tumors that were previously considered untreatable.\r\n\r\nConventional surgical methods often pose significant risks for patients with tumors located near critical organs or blood vessels, limiting treatment options and compromising patient outcomes. However, the advent of IRE represents a paradigm shift in surgical oncology, providing a minimally invasive alternative for patients facing challenging tumor locations.\r\n\r\nDr. Jonathan Carter, a leading oncological surgeon involved in the pioneering procedure, emphasized the transformative potential of IRE in improving treatment options for patients with inoperable tumors. \"IRE offers a unique advantage by selectively targeting cancer cells while sparing adjacent healthy tissue, minimizing the risk of complications and preserving organ function,\" explained Dr. Carter.', 'https://medinscare.s3.ap-south-1.amazonaws.com/hospitalNewsImages/operation.jpeg', '2024-03-05 20:07:28', NULL, 0, 0, 0),
(24, 12, 'Breakthrough Drug Shows Promise in Treating Rare Genetic Disorder', 'In a significant development for antibiotic resistance, researchers have unveiled a groundbreaking new medication that holds promise in combating stubborn bacterial infections that have become resistant to conventional treatments. The innovative drug, named \"Resistinex,\" targets a unique mechanism in bacterial cells, offering a novel approach to overcoming antibiotic resistance and saving lives threatened by drug-resistant pathogens.\r\n\r\nAntibiotic resistance has emerged as a global health crisis, with bacterial infections becoming increasingly difficult to treat due to the proliferation of resistant strains. However, Resistinex represents a beacon of hope in the fight against this growing threat. By disrupting essential pathways within bacterial cells, the medication effectively neutralizes resistant bacteria, rendering them susceptible to conventional antibiotics once again.\r\n\r\nDr. Sophia Reynolds, lead researcher of the study, hailed the discovery of Resistinex as a potential game-changer in the field of infectious diseases. \"Our findings demonstrate the efficacy of Resistinex in combating a wide range of multidrug-resistant bacteria, including those responsible for hospital-acquired infections and community outbreaks,\" stated Dr. Reynolds. \"This represents a significant breakthrough in our ongoing efforts to address the challenge of antibiotic resistance.\"\r\n\r\n', 'https://medinscare.s3.ap-south-1.amazonaws.com/hospitalNewsImages/newmed.jpeg', '2024-03-05 20:09:46', NULL, 0, 0, 0),
(25, 12, 'MARIAN ', 'MARAIN', 'https://medinscare.s3.ap-south-1.amazonaws.com/hospitalNewsImages/maledoc.jpeg', '2024-03-06 13:51:39', NULL, 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `Hospital_Staffs`
--

CREATE TABLE `Hospital_Staffs` (
  `hospitalStaffId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `hospitalStaffName` varchar(255) NOT NULL,
  `hospitalStaffEmail` varchar(255) NOT NULL,
  `hospitalStaffAadhar` varchar(20) NOT NULL,
  `hospitalStaffMobile` varchar(20) NOT NULL,
  `hospitalStaffAddress` varchar(500) NOT NULL,
  `hospitalStaffProfileImage` varchar(2000) NOT NULL,
  `hospitalStaffIdProofImage` varchar(2000) NOT NULL,
  `hospitalStaffPassword` varchar(2000) NOT NULL,
  `addedDate` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedDate` datetime DEFAULT NULL,
  `deleteStatus` int(11) NOT NULL DEFAULT 0,
  `isSuspended` int(11) NOT NULL DEFAULT 0,
  `updateStatus` int(11) NOT NULL DEFAULT 0,
  `passwordUpdateStatus` int(11) NOT NULL DEFAULT 0,
  `isActive` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Hospital_Staffs`
--

INSERT INTO `Hospital_Staffs` (`hospitalStaffId`, `hospitalId`, `hospitalStaffName`, `hospitalStaffEmail`, `hospitalStaffAadhar`, `hospitalStaffMobile`, `hospitalStaffAddress`, `hospitalStaffProfileImage`, `hospitalStaffIdProofImage`, `hospitalStaffPassword`, `addedDate`, `updatedDate`, `deleteStatus`, `isSuspended`, `updateStatus`, `passwordUpdateStatus`, `isActive`) VALUES
(16, 12, 'Jaice George', 'jaicegeorge2024@gmail.com', '111111111112', '+918113010619', '23e23e', 'https://medinscare.s3.ap-south-1.amazonaws.com/hospitalStaffImages/hospitalStaffProfile-1710676077076.jpg', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffIdProof-1709645783627.jpeg', '$2b$10$ZT1UPaELsK0idzJhA1BkYekhGgEQ8cZ8sIf0jg2uX.1UNSuiNnKZu', '2024-03-05 19:06:24', '2024-03-17 17:17:58', 0, 0, 1, 0, 1),
(17, 12, 'Sebin Jacob', 'sebinjacob2024@gmail.com', '111111111113', '+918113010619', 'Njondimackal House Mukkulam East P.O Mukkulam', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffProfileImage-1709646783630.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffIdProof-1709646783630.png', '$2b$10$hwXkqTwQXkjW56zvdFOZeui47TVMRxNz.Uy1.DRY3oqFdHB26JrWa', '2024-03-05 19:23:04', NULL, 0, 1, 0, 0, 0),
(18, 12, 'Animesh Thomas', 'animeshthomas2024@gmail.com', '111111111114', '+918113010619', 'Mundakkayam Panakkachira', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffProfileImage-1709646856222.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffIdProof-1709646856222.png', '$2b$10$r8uj0yZXpQ2vjF6xSTvUY.4la2uW2wcVo/ig76/rnXV6619c9HFTm', '2024-03-05 19:24:17', NULL, 0, 0, 0, 0, 1),
(19, 12, 'Ajay kumar MA', 'ajaykumarma2024@gmail.com', '111111111115', '+918113010619', 'Kuttikanam ', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffProfileImage-1709646943178.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffIdProof-1709646943178.jpeg', '$2b$10$0LVWT/j1h6rXdyB1FqOXY.cQ7EiOTva8wqxE.C6.YOK5ESW5N2Df6', '2024-03-05 19:25:43', NULL, 0, 0, 0, 0, 1),
(20, 12, 'Abdul Hakkeem', 'hakkeem2024@gmail.com', '111111111116', '+918113010619', 'Mundakkayam ', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffProfileImage-1709647004138.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffIdProof-1709647004138.jpeg', '$2b$10$BFa6yCq6xRpWzbC41YAcQOeTG6bT/fU2ZA91b3afWM81dAXI6dI7K', '2024-03-05 19:26:45', NULL, 0, 0, 0, 0, 1),
(21, 12, 'Sumesh J', 'sumeshj2024@gmail.com', '111111111117', '+918113010619', 'Kuttikanam', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffProfileImage-1709647071421.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffIdProof-1709647071421.png', '$2b$10$VKZaVXEqEhkU6d048ufzFupz2kQmyRa0.p3PIGx6eU92bbLaXcJqy', '2024-03-05 19:27:52', NULL, 0, 1, 0, 0, 0),
(22, 12, 'Thomas Mathew', 'thomas2024@gmail.com', '111111111118', '+918113010619', 'Kozhikkod', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffProfileImage-1709647126444.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffIdProof-1709647126444.jpeg', '$2b$10$m8BMUFsfhBskc5J2ZaOuSue5/BVJnrntnMMxdGabh3MsKVYkGxjqi', '2024-03-05 19:28:48', NULL, 0, 0, 0, 0, 1),
(27, 12, 'Libin Jacob', 'libinakaoski@gmail.com', '111111111178', '8113010619', 'Njondimackal House Mukkulam East P.O Mukkulam', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffProfileImage-1709889816697.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/staffImages/staffIdProof-1709889816697.jpeg', '$2b$10$fxj8zDidE6/9QMvtZBuIcOjvnP8h/s38qy6f/njgj1ARWHwL3zimC', '2024-03-08 14:53:37', NULL, 0, 0, 0, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `Insurance_Packages`
--

CREATE TABLE `Insurance_Packages` (
  `packageId` int(11) NOT NULL,
  `insuranceProviderId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `packageTitle` varchar(255) NOT NULL,
  `packageDetails` varchar(2000) NOT NULL,
  `packageImage` varchar(2000) DEFAULT NULL,
  `packageDuration` varchar(255) NOT NULL,
  `packageAmount` varchar(255) NOT NULL,
  `packageTAndC` varchar(2000) NOT NULL,
  `addedDate` datetime DEFAULT current_timestamp(),
  `updatedDate` datetime DEFAULT NULL,
  `updateStatus` int(11) NOT NULL DEFAULT 0,
  `deleteStatus` int(11) NOT NULL DEFAULT 0,
  `isActive` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Insurance_Packages`
--

INSERT INTO `Insurance_Packages` (`packageId`, `insuranceProviderId`, `hospitalId`, `packageTitle`, `packageDetails`, `packageImage`, `packageDuration`, `packageAmount`, `packageTAndC`, `addedDate`, `updatedDate`, `updateStatus`, `deleteStatus`, `isActive`) VALUES
(9, 19, 12, 'gfcvhgjchvbhjvghj', 'cfgvhbhyvkhjbyhbjuvykh', 'https://medinscare.s3.ap-south-1.amazonaws.com/packageImages/insurance3.jpeg', 'vhbgh', '12222', 'ytghbjiyhjlbuyhj', '2024-03-16 04:50:03', NULL, 0, 0, 1),
(10, 19, 12, 'vgshbjwfvdhb', 'dfedwvrwfedefw', 'https://medinscare.s3.ap-south-1.amazonaws.com/packageImages/inspfemale.jpeg', 'dwefd', '122222', 'ergrfwedfr', '2024-03-16 04:50:27', NULL, 0, 0, 1),
(11, 19, 12, '3edr34e34', '3edfegrfwefr', 'https://medinscare.s3.ap-south-1.amazonaws.com/packageImages/inspmale.jpg', 'ewdwfed', '10000000', 'refrefrefwe', '2024-03-16 04:50:48', NULL, 0, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `Insurance_Providers`
--

CREATE TABLE `Insurance_Providers` (
  `insuranceProviderId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `insuranceProviderName` varchar(100) NOT NULL,
  `insuranceProviderEmail` varchar(100) NOT NULL,
  `insuranceProviderAadhar` varchar(20) NOT NULL,
  `insuranceProviderMobile` varchar(20) NOT NULL,
  `insuranceProviderProfileImage` varchar(2000) NOT NULL,
  `insuranceProviderIdProofImage` varchar(2000) NOT NULL,
  `insuranceProviderAddress` varchar(500) NOT NULL,
  `insuranceProviderPassword` varchar(2000) NOT NULL,
  `registeredDate` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedDate` datetime DEFAULT NULL,
  `passwordUpdateStatus` int(11) NOT NULL DEFAULT 0,
  `isActive` int(11) NOT NULL DEFAULT 1,
  `isSuspended` int(11) NOT NULL DEFAULT 0,
  `updateStatus` int(11) NOT NULL DEFAULT 0,
  `isApproved` int(11) NOT NULL DEFAULT 0,
  `deleteStatus` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Insurance_Providers`
--

INSERT INTO `Insurance_Providers` (`insuranceProviderId`, `hospitalId`, `insuranceProviderName`, `insuranceProviderEmail`, `insuranceProviderAadhar`, `insuranceProviderMobile`, `insuranceProviderProfileImage`, `insuranceProviderIdProofImage`, `insuranceProviderAddress`, `insuranceProviderPassword`, `registeredDate`, `updatedDate`, `passwordUpdateStatus`, `isActive`, `isSuspended`, `updateStatus`, `isApproved`, `deleteStatus`) VALUES
(19, 12, 'Libin Jacob', 'libinakaoski@gmail.com', '111111111111', '8113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderProfile-1710605282708.jpg', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderIdProof-1710605266891.jpg', 'refn qewndejw f', '$2b$10$.e0sZq4hqcuUocCvQNyYceAmIppoLv1lp7ZGEnzx.wTNMfsSOzXXi', '2024-03-16 03:10:50', '2024-03-16 21:38:04', 0, 1, 0, 1, 1, 0),
(20, 12, 'Libin Jacob', 'libinakaoski@gmail.comde', '111111111113', '8113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderProfileImage-1710538919673.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderIdProof-1710538919673.jpeg', 'dwed', '$2b$10$S/IWkxhhqMjhQQ6hP9840OvP1Hrq9xZM3GIZ7gLL5gi8upKlG8UhC', '2024-03-16 03:12:00', NULL, 0, 1, 0, 0, 1, 0),
(21, 12, 'Libin Jacob', 'libinakaoski@gmail.comdd', '111111111114', '8113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderProfileImage-1710539354049.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderIdProof-1710539354049.jpeg', 'dwed', '$2b$10$4IhVacwNlLXYDvxmXU.nNuVuyyrsr.jdpxKMaahlWZwEHULtMC2Si', '2024-03-16 03:19:14', NULL, 0, 1, 0, 0, 1, 0),
(22, 12, 'Libin Jacob', 'libinakaoski@gmail.comdddd', '111111111116', '8113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderProfileImage-1710540015678.jpg', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderIdProof-1710540015678.jpeg', 'ed34343', '$2b$10$bgALh2FWMy77rd5VHP/bK.DsBaB5zsrA/.qHjC0s7cLIrwNBOCAAq', '2024-03-16 03:30:16', NULL, 0, 1, 0, 0, 0, 0),
(23, 12, 'fwedwfedewf', 'libinakaoski@gmail.comffff', '111111111117', '8113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderProfileImage-1710540276447.jpg', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderIdProof-1710540276447.jpeg', 'dwed', '$2b$10$fZWFMRMGZn6n.CeFpAJSteveST/Ce/3WaPKugF5rU7RjTS72boZ9C', '2024-03-16 03:34:37', NULL, 0, 1, 0, 0, 0, 0),
(24, 12, 'Libin Jacob', 'libinakaoski@gmail.comddddf', '111111111133', '8113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderProfileImage-1710540408419.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderIdProof-1710540408419.jpeg', 'rf3ferde', '$2b$10$Z19uU43B7BTUsOLZ3D.ghuspacntP7Iodi9TsrJyzuC8lEoLeTI4G', '2024-03-16 03:36:49', NULL, 0, 1, 0, 0, 0, 0),
(25, 12, 'Libin Jacob', 'libinakaoski@gmail.comwd', '111111141119', '8113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderProfileImage-1710540624190.jpg', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderIdProof-1710540624190.jpeg', 'wdewded', '$2b$10$l/QNRBnJ1GTYSjIiLptpDeTS8OcQ3Rg64Y8mOZFCsHZJyQuJ6EM/K', '2024-03-16 03:40:25', NULL, 0, 1, 0, 0, 0, 0),
(26, 14, 'Libin Jacob', 'libinakaoski@gmail.comdded', '111111111123', '8113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderProfileImage-1710542161519.jpg', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderIdProof-1710542161519.jpg', 'edeedewd', '$2b$10$BxBLVPoKKVfwvAWpZ.z2NO0IprpG5bECe7MepG3I1RnXCkIYnGoqe', '2024-03-16 04:06:03', NULL, 0, 1, 0, 0, 0, 0),
(27, 14, 'sddedwde', 'libinakaoski@gmail.comddddds', '111111111155', '8113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderProfileImage-1710542260227.jpg', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderIdProof-1710542260227.png', 'dwed', '$2b$10$D4VHEn8M6qyMF/0TacLVnuiJe1mAikAH0B52Pvn1K29SLYh1JHhmu', '2024-03-16 04:07:41', NULL, 0, 1, 0, 0, 0, 0),
(28, 12, 'Libin Jacob', 'libinakaoski@gmail.comedweferfde', '111111111144', '8113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderProfileImage-1710542568847.jpg', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderIdProof-1710542568847.jpg', 'edeedewd', '$2b$10$V1KY6TlNTmt7z/emhaJIsekn4VERsjVTP.BdkL92gwhpe9Q5j800e', '2024-03-16 04:12:50', NULL, 0, 1, 0, 0, 0, 0),
(29, 12, 'Rehan', 'rehan@gmail.com', '333333333333', '9633428878', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderProfileImage-1710821198809.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/insuranceProviderImages/insuranceProviderIdProof-1710821198809.jpeg', 'nnbbaa', '$2b$10$32j6poHUFUJ0OHEjttDc9O0W5P5ADbUrPSKrHCD3YtguY48oleOje', '2024-03-19 09:36:39', NULL, 0, 1, 0, 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `Medical_Records`
--

CREATE TABLE `Medical_Records` (
  `recordId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `hospitalStaffId` int(11) NOT NULL,
  `patientProfileImage` varchar(2000) NOT NULL,
  `patientName` varchar(255) NOT NULL,
  `patientEmail` varchar(255) NOT NULL,
  `staffReport` varchar(2000) NOT NULL,
  `medicineAndLabCosts` varchar(2000) DEFAULT NULL,
  `byStanderName` varchar(255) NOT NULL,
  `byStanderMobileNumber` varchar(20) NOT NULL,
  `hospitalName` varchar(255) NOT NULL,
  `hospitalEmail` varchar(255) NOT NULL,
  `hospitalStaffName` varchar(255) NOT NULL,
  `hospitalStaffEmail` varchar(255) NOT NULL,
  `registeredDate` datetime NOT NULL,
  `dateGenerated` datetime DEFAULT current_timestamp(),
  `updateStatus` int(11) DEFAULT 0,
  `updatedDate` datetime DEFAULT NULL,
  `isActive` int(11) DEFAULT 1,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Medical_Records`
--

INSERT INTO `Medical_Records` (`recordId`, `patientId`, `hospitalId`, `hospitalStaffId`, `patientProfileImage`, `patientName`, `patientEmail`, `staffReport`, `medicineAndLabCosts`, `byStanderName`, `byStanderMobileNumber`, `hospitalName`, `hospitalEmail`, `hospitalStaffName`, `hospitalStaffEmail`, `registeredDate`, `dateGenerated`, `updateStatus`, `updatedDate`, `isActive`, `deleteStatus`) VALUES
(10, 10, 12, 16, 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientProfileImage-1709652020853.jpeg', 'Sebin Jacob', 'sebinjacob2024@gmail.com', '33w hbdj qhlwdj', '3rfrfd', 'rferferf', '8888888888', 'Medical Trsut', 'medicaltrusthospital2024@gmail.com', 'Jaice George', 'jaicegeorge2024@gmail.com', '2024-03-05 20:50:21', '2024-03-15 16:20:13', 0, NULL, 1, 0),
(11, 10, 12, 16, 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientProfileImage-1709652020853.jpeg', 'Sebin Jacob', 'sebinjacob2024@gmail.com', 'we3e34', '3e3e2e3', 'passss', '8113010619', 'Medical Trsut', 'medicaltrusthospital2024@gmail.com', 'Jaice George', 'jaicegeorge2024@gmail.com', '2024-03-05 20:50:21', '2024-03-16 22:54:14', 0, NULL, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `Notification_To_Clients`
--

CREATE TABLE `Notification_To_Clients` (
  `notificationId` int(11) NOT NULL,
  `insuranceProviderId` int(11) NOT NULL,
  `clientId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `message` varchar(2000) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `isSuccess` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Notification_To_Clients`
--

INSERT INTO `Notification_To_Clients` (`notificationId`, `insuranceProviderId`, `clientId`, `patientId`, `message`, `sendDate`, `isSuccess`) VALUES
(4, 19, 10, 8, 'ed34d3d34e', '2024-03-16 07:59:21', 1),
(5, 19, 10, 8, 'e2e32e23e', '2024-03-16 07:59:25', 1),
(6, 19, 10, 8, '2ed2e23e23e', '2024-03-16 07:59:29', 1),
(7, 19, 10, 8, '2ed23e32e3 23e23e32e', '2024-03-16 07:59:34', 1),
(8, 19, 10, 8, 'ede2d2e', '2024-03-16 07:59:38', 1),
(9, 19, 10, 8, 'wed23ed', '2024-03-17 13:50:34', 1);

-- --------------------------------------------------------

--
-- Table structure for table `Notification_To_Hospital_Staffs`
--

CREATE TABLE `Notification_To_Hospital_Staffs` (
  `notificationId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `hospitalStaffId` int(11) NOT NULL,
  `message` varchar(2000) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `isSuccess` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Notification_To_Hospital_Staffs`
--

INSERT INTO `Notification_To_Hospital_Staffs` (`notificationId`, `hospitalId`, `hospitalStaffId`, `message`, `sendDate`, `isSuccess`) VALUES
(38, 12, 16, 'Attention all hospital staff: Mandatory staff meeting tomorrow at 9:00 AM in the conference room. Important updates and protocols will be discussed. Your attendance is required. Thank you.', '2024-03-05 22:59:45', 1),
(39, 12, 16, 'Urgent notice: The hospital cafeteria will be closed for maintenance tomorrow from 12:00 PM to 3:00 PM. Please plan accordingly. Apologies for any inconvenience caused.\n\n', '2024-03-05 22:59:56', 1),
(40, 12, 16, 'Reminder: Don\'t forget to complete your mandatory training modules by the end of this week. Compliance is necessary to maintain our accreditation standards. Thank you for your cooperation.\n\n', '2024-03-05 23:00:07', 1),
(41, 12, 16, 'Attention nurses and physicians: A new policy regarding medication administration has been implemented. Please review the updated protocol document available on the intranet. Any questions, contact the nursing supervisor or medical director.', '2024-03-05 23:00:20', 1),
(42, 12, 16, 'Staff reminder: Our annual flu vaccination drive starts next week. Ensure you get vaccinated to protect yourself, your colleagues, and our patients. Let\'s prioritize safety and well-being together.', '2024-03-05 23:00:31', 1),
(43, 12, 16, 'Attention all hospital staff: The parking lot will undergo maintenance starting this Saturday. Limited parking spaces will be available. Please carpool or consider alternative transportation methods. Thank you for your understanding.', '2024-03-05 23:00:41', 1),
(44, 12, 16, 'Emergency response drill scheduled for next Wednesday at 10:00 AM. All staff members are required to participate. This drill is essential for ensuring our readiness to handle critical situations effectively.', '2024-03-05 23:00:52', 1),
(45, 12, 16, 'Attention all front desk and reception staff: A new visitor registration process has been implemented. Please familiarize yourselves with the updated procedures to ensure smooth operations at the front desk. Thank you for your attention to detail.', '2024-03-05 23:01:02', 1),
(46, 12, 16, 'Reminder: Performance evaluations are due by the end of this month. Managers, please ensure timely completion and submission of evaluations for your respective teams. Your feedback is crucial for professional development.', '2024-03-05 23:01:12', 1),
(47, 12, 16, 'Attention all hospital staff: The IT department will conduct system maintenance tonight from 10:00 PM to 2:00 AM. Expect intermittent disruptions to hospital systems during this period. We apologize for any inconvenience and appreciate your patience.\n\n\n\n\n\n', '2024-03-05 23:01:31', 1),
(48, 12, 16, 'hi', '2024-03-06 13:47:23', 1),
(50, 12, 21, '334', '2024-03-15 19:19:41', 1);

-- --------------------------------------------------------

--
-- Table structure for table `Notification_To_Insurance_Providers`
--

CREATE TABLE `Notification_To_Insurance_Providers` (
  `notificationId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `insuranceProviderId` int(11) NOT NULL,
  `message` varchar(2000) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `isSuccess` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Notification_To_Patients`
--

CREATE TABLE `Notification_To_Patients` (
  `notificationId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `message` varchar(2000) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `isSuccess` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Notification_To_Patients`
--

INSERT INTO `Notification_To_Patients` (`notificationId`, `hospitalId`, `patientId`, `message`, `sendDate`, `isSuccess`) VALUES
(14, 12, 11, ' MARIAN', '2024-03-06 13:50:10', 1);

-- --------------------------------------------------------

--
-- Table structure for table `Notification_To_Patients_From_Staff`
--

CREATE TABLE `Notification_To_Patients_From_Staff` (
  `notificationId` int(11) NOT NULL,
  `hospitalStaffId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `message` varchar(2000) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `isSuccess` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Notification_To_Patients_From_Staff`
--

INSERT INTO `Notification_To_Patients_From_Staff` (`notificationId`, `hospitalStaffId`, `patientId`, `message`, `sendDate`, `isSuccess`) VALUES
(6, 16, 11, 'nmnjn', '2024-03-05 22:31:35', 1),
(7, 16, 11, 'dqdwdwaax qdqdad', '2024-03-05 22:46:55', 1);

-- --------------------------------------------------------

--
-- Table structure for table `Patients`
--

CREATE TABLE `Patients` (
  `patientId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `hospitalStaffId` int(11) NOT NULL,
  `patientName` varchar(255) NOT NULL,
  `diagnosisOrDiseaseType` varchar(500) NOT NULL,
  `admittedWard` varchar(200) NOT NULL,
  `patientEmail` varchar(255) NOT NULL,
  `patientAadhar` varchar(20) NOT NULL,
  `patientMobile` varchar(20) NOT NULL,
  `patientProfileImage` varchar(2000) NOT NULL,
  `patientIdProofImage` varchar(2000) NOT NULL,
  `patientAddress` varchar(500) NOT NULL,
  `patientGender` varchar(50) NOT NULL,
  `patientAge` int(11) NOT NULL,
  `patientPassword` varchar(2000) NOT NULL,
  `registeredDate` datetime NOT NULL DEFAULT current_timestamp(),
  `dischargedDate` datetime DEFAULT NULL,
  `updatedDate` datetime DEFAULT NULL,
  `passwordUpdateStatus` int(11) NOT NULL DEFAULT 0,
  `dischargeStatus` int(11) NOT NULL DEFAULT 0,
  `updateStatus` int(11) NOT NULL DEFAULT 0,
  `isActive` int(11) NOT NULL DEFAULT 1,
  `deleteStatus` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Patients`
--

INSERT INTO `Patients` (`patientId`, `hospitalId`, `hospitalStaffId`, `patientName`, `diagnosisOrDiseaseType`, `admittedWard`, `patientEmail`, `patientAadhar`, `patientMobile`, `patientProfileImage`, `patientIdProofImage`, `patientAddress`, `patientGender`, `patientAge`, `patientPassword`, `registeredDate`, `dischargedDate`, `updatedDate`, `passwordUpdateStatus`, `dischargeStatus`, `updateStatus`, `isActive`, `deleteStatus`) VALUES
(8, 12, 16, 'Animesh Thomas', '', '', 'animeshthomas2024@gmail.com', '111111111111', '+918113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/patientImages/patientProfile-1710605711827.png', 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientIdProof-1709650928354.jpeg', 'Mundakkayam', 'male', 23, '$2b$10$SuZBHjFs5aHBr4ss7Q3k.uNkjV5KiuLMEVocRbiLUQeCBxwu5iKhG', '2024-03-05 20:32:09', NULL, '2024-03-17 00:00:00', 0, 0, 1, 1, 0),
(9, 12, 16, 'Ajay Kumar MA', '', '', 'ajaykumarma@gmail.com', '111111111112', '+918113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientProfileImage-1709650995954.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientIdProof-1709650995954.png', 'Kottayam', 'male', 25, '$2b$10$vR4Me9SlA3QAdMhBPyNt.upoCX/dKEsfx5BgsFVmmDvN2/5Y2O6Dy', '2024-03-05 20:33:16', NULL, NULL, 0, 0, 0, 1, 0),
(10, 12, 16, 'Sebin Jacob', '', '', 'sebinjacob2024@gmail.com', '111111111122', '+918113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientProfileImage-1709652020853.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientIdProof-1709652020853.png', 'Mundakkayam Mukkulam ', 'male', 28, '$2b$10$Lit1fUNe8QL33zRdYmMPJ.aEyHdD3CkjNPRKRlDXA1sjxvdi7CPFW', '2024-03-05 20:50:21', NULL, '2024-03-05 00:00:00', 0, 0, 1, 1, 0),
(11, 12, 16, 'Sumesh j', '', '', 'sumeshj@gmail.com', '221111111111', '+918113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientProfileImage-1709652127907.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientIdProof-1709652127907.png', 'Njondimackal House Mukkulam East P.O Mukkulam', 'male', 23, '$2b$10$1zczFQIW5G85t1B2JD79Xe71qfhqVIO1dIJeWNoVbAM9D6RCDGmsa', '2024-03-05 20:52:08', NULL, NULL, 0, 0, 0, 1, 0),
(12, 12, 16, 'Albi', '', '', 'albi@gmail.com', '111111111190', '+918113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientProfileImage-1709712183056.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientIdProof-1709712183055.jpeg', 'Njondimackal House Mukkulam East P.O Mukkulam', 'male', 23, '$2b$10$EZ7LZdkgXFCi7nEOoN4M8eQvOSZHYvvnqNmYEY1Fo3Z30lMvlN5mi', '2024-03-06 13:33:06', NULL, NULL, 0, 0, 0, 1, 0),
(13, 12, 16, 'Libin', 'diagnosis2', 'ward1', 'libin@gmail.com', '111111111100', '8113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientProfileImage-1709877704513.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientIdProof-1709877704513.png', 'Njondimackal House Mukkulam East P.O Mukkulam', 'male', 23, '$2b$10$bsLk/regBPieaV8M0Un6ZeT285HvtpK4xY7gfqnCWGM3RzUqkV8vW', '2024-03-08 11:31:45', NULL, NULL, 0, 0, 0, 1, 0),
(15, 12, 16, 'Libin Jacob', 'diagnosis1', 'ward1', 'libinakaoski@gmail.com', '111111111133', '8113010619', 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientProfileImage-1709891131681.jpeg', 'https://medinscare.s3.ap-south-1.amazonaws.com/PatientImages/patientIdProof-1709891131681.jpeg', 'Njondimackal House Mukkulam East P.O Mukkulam', 'male', 23, '$2b$10$W0EkHkgv5CxDVySp0ZLsnukCJG.NjvahkNk8qePZfn0qX9IguT6KS', '2024-03-08 15:15:32', NULL, NULL, 0, 0, 0, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `Reviews`
--

CREATE TABLE `Reviews` (
  `reviewId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `insuranceProviderId` int(11) NOT NULL,
  `insuranceProviderName` varchar(200) NOT NULL,
  `patientId` int(11) NOT NULL,
  `patientName` varchar(200) NOT NULL,
  `patientProfileImage` varchar(2000) NOT NULL,
  `reviewContent` varchar(2000) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `isActive` int(11) DEFAULT 1,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Reviews`
--

INSERT INTO `Reviews` (`reviewId`, `hospitalId`, `insuranceProviderId`, `insuranceProviderName`, `patientId`, `patientName`, `patientProfileImage`, `reviewContent`, `sendDate`, `isActive`, `deleteStatus`) VALUES
(13, 12, 19, 'Libin Jacob', 8, 'Animesh Thomas', 'https://medinscare.s3.ap-south-1.amazonaws.com/patientImages/patientProfile-1710605711827.png', '', '2024-03-17 18:58:46', 1, 0),
(14, 12, 19, 'Libin Jacob', 8, 'Animesh Thomas', 'https://medinscare.s3.ap-south-1.amazonaws.com/patientImages/patientProfile-1710605711827.png', '', '2024-03-17 18:58:48', 1, 0),
(15, 12, 19, 'Libin Jacob', 8, 'Animesh Thomas', 'https://medinscare.s3.ap-south-1.amazonaws.com/patientImages/patientProfile-1710605711827.png', '', '2024-03-17 18:59:54', 1, 0),
(16, 12, 20, 'Libin Jacob', 8, 'Animesh Thomas', 'https://medinscare.s3.ap-south-1.amazonaws.com/patientImages/patientProfile-1710605711827.png', '', '2024-03-17 19:00:57', 1, 0),
(17, 12, 20, 'Libin Jacob', 8, 'Animesh Thomas', 'https://medinscare.s3.ap-south-1.amazonaws.com/patientImages/patientProfile-1710605711827.png', 'ed2we3e', '2024-03-17 19:02:14', 1, 0),
(18, 12, 21, 'Libin Jacob', 8, 'Animesh Thomas', 'https://medinscare.s3.ap-south-1.amazonaws.com/patientImages/patientProfile-1710605711827.png', 'wedd', '2024-03-17 19:02:30', 1, 0),
(19, 12, 21, 'Libin Jacob', 8, 'Animesh Thomas', 'https://medinscare.s3.ap-south-1.amazonaws.com/patientImages/patientProfile-1710605711827.png', 'ed343e2', '2024-03-17 19:03:56', 1, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Bills`
--
ALTER TABLE `Bills`
  ADD PRIMARY KEY (`billId`),
  ADD KEY `patientId` (`patientId`),
  ADD KEY `hospitalId` (`hospitalId`);

--
-- Indexes for table `Clients`
--
ALTER TABLE `Clients`
  ADD PRIMARY KEY (`clientId`),
  ADD KEY `patientId` (`patientId`),
  ADD KEY `packageId` (`packageId`),
  ADD KEY `insuranceProviderId` (`insuranceProviderId`),
  ADD KEY `hospitalId` (`hospitalId`);

--
-- Indexes for table `Discharge_Requests`
--
ALTER TABLE `Discharge_Requests`
  ADD PRIMARY KEY (`requestId`),
  ADD KEY `patientId` (`patientId`),
  ADD KEY `hospitalStaffId` (`hospitalStaffId`),
  ADD KEY `hospitalId` (`hospitalId`);

--
-- Indexes for table `Hospitals`
--
ALTER TABLE `Hospitals`
  ADD PRIMARY KEY (`hospitalId`),
  ADD UNIQUE KEY `hospitalEmail` (`hospitalEmail`),
  ADD UNIQUE KEY `hospitalAadhar` (`hospitalAadhar`);

--
-- Indexes for table `Hospital_News`
--
ALTER TABLE `Hospital_News`
  ADD PRIMARY KEY (`hospitalNewsId`),
  ADD KEY `hospitalId` (`hospitalId`);

--
-- Indexes for table `Hospital_Staffs`
--
ALTER TABLE `Hospital_Staffs`
  ADD PRIMARY KEY (`hospitalStaffId`),
  ADD UNIQUE KEY `hospitalStaffEmail` (`hospitalStaffEmail`),
  ADD UNIQUE KEY `hospitalStaffAadhar` (`hospitalStaffAadhar`),
  ADD KEY `hospitalId` (`hospitalId`);

--
-- Indexes for table `Insurance_Packages`
--
ALTER TABLE `Insurance_Packages`
  ADD PRIMARY KEY (`packageId`),
  ADD KEY `insuranceProviderId` (`insuranceProviderId`),
  ADD KEY `hospitalId` (`hospitalId`);

--
-- Indexes for table `Insurance_Providers`
--
ALTER TABLE `Insurance_Providers`
  ADD PRIMARY KEY (`insuranceProviderId`),
  ADD KEY `hospitalId` (`hospitalId`);

--
-- Indexes for table `Medical_Records`
--
ALTER TABLE `Medical_Records`
  ADD PRIMARY KEY (`recordId`),
  ADD KEY `patientId` (`patientId`),
  ADD KEY `hospitalId` (`hospitalId`),
  ADD KEY `hospitalStaffId` (`hospitalStaffId`);

--
-- Indexes for table `Notification_To_Clients`
--
ALTER TABLE `Notification_To_Clients`
  ADD PRIMARY KEY (`notificationId`),
  ADD KEY `insuranceProviderId` (`insuranceProviderId`),
  ADD KEY `clientId` (`clientId`);

--
-- Indexes for table `Notification_To_Hospital_Staffs`
--
ALTER TABLE `Notification_To_Hospital_Staffs`
  ADD PRIMARY KEY (`notificationId`),
  ADD KEY `hospitalId` (`hospitalId`),
  ADD KEY `hospitalStaffId` (`hospitalStaffId`);

--
-- Indexes for table `Notification_To_Insurance_Providers`
--
ALTER TABLE `Notification_To_Insurance_Providers`
  ADD PRIMARY KEY (`notificationId`),
  ADD KEY `hospitalId` (`hospitalId`),
  ADD KEY `insuranceProviderId` (`insuranceProviderId`);

--
-- Indexes for table `Notification_To_Patients`
--
ALTER TABLE `Notification_To_Patients`
  ADD PRIMARY KEY (`notificationId`),
  ADD KEY `hospitalId` (`hospitalId`),
  ADD KEY `patientId` (`patientId`);

--
-- Indexes for table `Notification_To_Patients_From_Staff`
--
ALTER TABLE `Notification_To_Patients_From_Staff`
  ADD PRIMARY KEY (`notificationId`),
  ADD KEY `hospitalStaffId` (`hospitalStaffId`),
  ADD KEY `patientId` (`patientId`);

--
-- Indexes for table `Patients`
--
ALTER TABLE `Patients`
  ADD PRIMARY KEY (`patientId`),
  ADD KEY `hospitalId` (`hospitalId`),
  ADD KEY `hospitalStaffId` (`hospitalStaffId`);

--
-- Indexes for table `Reviews`
--
ALTER TABLE `Reviews`
  ADD PRIMARY KEY (`reviewId`),
  ADD KEY `hospitalId` (`hospitalId`),
  ADD KEY `insuranceProviderId` (`insuranceProviderId`),
  ADD KEY `patientId` (`patientId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Bills`
--
ALTER TABLE `Bills`
  MODIFY `billId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `Clients`
--
ALTER TABLE `Clients`
  MODIFY `clientId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `Discharge_Requests`
--
ALTER TABLE `Discharge_Requests`
  MODIFY `requestId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `Hospitals`
--
ALTER TABLE `Hospitals`
  MODIFY `hospitalId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `Hospital_News`
--
ALTER TABLE `Hospital_News`
  MODIFY `hospitalNewsId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `Hospital_Staffs`
--
ALTER TABLE `Hospital_Staffs`
  MODIFY `hospitalStaffId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `Insurance_Packages`
--
ALTER TABLE `Insurance_Packages`
  MODIFY `packageId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `Insurance_Providers`
--
ALTER TABLE `Insurance_Providers`
  MODIFY `insuranceProviderId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `Medical_Records`
--
ALTER TABLE `Medical_Records`
  MODIFY `recordId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `Notification_To_Clients`
--
ALTER TABLE `Notification_To_Clients`
  MODIFY `notificationId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `Notification_To_Hospital_Staffs`
--
ALTER TABLE `Notification_To_Hospital_Staffs`
  MODIFY `notificationId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `Notification_To_Insurance_Providers`
--
ALTER TABLE `Notification_To_Insurance_Providers`
  MODIFY `notificationId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `Notification_To_Patients`
--
ALTER TABLE `Notification_To_Patients`
  MODIFY `notificationId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `Notification_To_Patients_From_Staff`
--
ALTER TABLE `Notification_To_Patients_From_Staff`
  MODIFY `notificationId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `Patients`
--
ALTER TABLE `Patients`
  MODIFY `patientId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `Reviews`
--
ALTER TABLE `Reviews`
  MODIFY `reviewId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Bills`
--
ALTER TABLE `Bills`
  ADD CONSTRAINT `bills_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE,
  ADD CONSTRAINT `bills_ibfk_2` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Clients`
--
ALTER TABLE `Clients`
  ADD CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE,
  ADD CONSTRAINT `clients_ibfk_2` FOREIGN KEY (`packageId`) REFERENCES `Insurance_Packages` (`packageId`) ON DELETE CASCADE,
  ADD CONSTRAINT `clients_ibfk_3` FOREIGN KEY (`insuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `clients_ibfk_4` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Discharge_Requests`
--
ALTER TABLE `Discharge_Requests`
  ADD CONSTRAINT `discharge_requests_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE,
  ADD CONSTRAINT `discharge_requests_ibfk_2` FOREIGN KEY (`hospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE,
  ADD CONSTRAINT `discharge_requests_ibfk_3` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Hospital_News`
--
ALTER TABLE `Hospital_News`
  ADD CONSTRAINT `hospital_news_ibfk_1` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Hospital_Staffs`
--
ALTER TABLE `Hospital_Staffs`
  ADD CONSTRAINT `hospital_staffs_ibfk_1` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Insurance_Packages`
--
ALTER TABLE `Insurance_Packages`
  ADD CONSTRAINT `insurance_packages_ibfk_1` FOREIGN KEY (`insuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `insurance_packages_ibfk_2` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Insurance_Providers`
--
ALTER TABLE `Insurance_Providers`
  ADD CONSTRAINT `insurance_providers_ibfk_1` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Medical_Records`
--
ALTER TABLE `Medical_Records`
  ADD CONSTRAINT `medical_records_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE,
  ADD CONSTRAINT `medical_records_ibfk_2` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `medical_records_ibfk_3` FOREIGN KEY (`hospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE;

--
-- Constraints for table `Notification_To_Clients`
--
ALTER TABLE `Notification_To_Clients`
  ADD CONSTRAINT `notification_to_clients_ibfk_1` FOREIGN KEY (`insuranceProviderId`) REFERENCES `Insurance_providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `notification_to_clients_ibfk_2` FOREIGN KEY (`clientId`) REFERENCES `Clients` (`clientId`) ON DELETE CASCADE;

--
-- Constraints for table `Notification_To_Hospital_Staffs`
--
ALTER TABLE `Notification_To_Hospital_Staffs`
  ADD CONSTRAINT `notification_to_hospital_staffs_ibfk_1` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `notification_to_hospital_staffs_ibfk_2` FOREIGN KEY (`hospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE;

--
-- Constraints for table `Notification_To_Insurance_Providers`
--
ALTER TABLE `Notification_To_Insurance_Providers`
  ADD CONSTRAINT `notification_to_insurance_providers_ibfk_1` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `notification_to_insurance_providers_ibfk_2` FOREIGN KEY (`insuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE;

--
-- Constraints for table `Notification_To_Patients`
--
ALTER TABLE `Notification_To_Patients`
  ADD CONSTRAINT `notification_to_patients_ibfk_1` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `notification_to_patients_ibfk_2` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE;

--
-- Constraints for table `Notification_To_Patients_From_Staff`
--
ALTER TABLE `Notification_To_Patients_From_Staff`
  ADD CONSTRAINT `notification_to_patients_from_staff_ibfk_1` FOREIGN KEY (`hospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE,
  ADD CONSTRAINT `notification_to_patients_from_staff_ibfk_2` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE;

--
-- Constraints for table `Patients`
--
ALTER TABLE `Patients`
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `patients_ibfk_2` FOREIGN KEY (`hospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE;

--
-- Constraints for table `Reviews`
--
ALTER TABLE `Reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`insuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
