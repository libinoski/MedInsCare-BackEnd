-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jan 24, 2024 at 12:45 PM
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
  `insuranceProviderId` int(11) DEFAULT NULL,
  `hospitalId` int(11) NOT NULL,
  `generatedBy` varchar(255) NOT NULL,
  `billRecipient` varchar(255) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `billAmount` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `passwordUpdatedStatus` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Hospital_News`
--

CREATE TABLE `Hospital_News` (
  `hospitalNewsId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `hospitalNewsTitle` varchar(500) NOT NULL,
  `hospitalNewsContent` varchar(2000) NOT NULL,
  `hospitalNewsImage` varchar(2000) NOT NULL,
  `addedDate` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedDate` datetime DEFAULT NULL,
  `isActive` int(11) NOT NULL DEFAULT 1,
  `deleteStatus` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `isActive` int(11) NOT NULL DEFAULT 1,
  `deleteStatus` int(11) NOT NULL DEFAULT 0,
  `updateStatus` int(11) NOT NULL DEFAULT 0,
  `passwordUpdateStatus` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Insurance_Details`
--

CREATE TABLE `Insurance_Details` (
  `insuranceId` int(11) NOT NULL,
  `insuranceProviderId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `insuranceName` varchar(255) NOT NULL,
  `insuranceDescription` varchar(2000) NOT NULL,
  `insuranceImage` varchar(2000) NOT NULL,
  `insuranceStartDate` datetime NOT NULL DEFAULT current_timestamp(),
  `insuranceEndDate` datetime DEFAULT NULL,
  `isActive` int(11) NOT NULL DEFAULT 1,
  `deleteStatus` int(11) NOT NULL DEFAULT 0,
  `reNewedDate` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `IpRegisteredDate` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedDate` datetime DEFAULT NULL,
  `passwordUpdatedStatus` int(11) NOT NULL DEFAULT 0,
  `isActive` int(11) NOT NULL DEFAULT 1,
  `deleteStatus` int(11) NOT NULL DEFAULT 0,
  `updatedStatus` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Lab_Results`
--

CREATE TABLE `Lab_Results` (
  `labResultId` int(11) NOT NULL,
  `hospitalStaffId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `insuranceProviderId` int(11) DEFAULT NULL,
  `labResultContent` varchar(2000) NOT NULL,
  `labResultImage` varchar(200) DEFAULT NULL,
  `senderName` varchar(255) NOT NULL,
  `receiverName` varchar(255) NOT NULL,
  `sendDate` datetime NOT NULL DEFAULT current_timestamp(),
  `receivedDate` datetime DEFAULT NULL,
  `isRead` int(11) NOT NULL DEFAULT 0,
  `deleteStatus` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Medical_Conditions`
--

CREATE TABLE `Medical_Conditions` (
  `medicalConditionId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `insuranceProviderId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `hospitalStaffId` int(11) NOT NULL,
  `medicalConditionContent` varchar(2000) NOT NULL,
  `senderName` varchar(255) NOT NULL,
  `receiverName` varchar(255) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `receivedDate` datetime DEFAULT NULL,
  `isRead` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Meeting_Schedule_By_Hospital_Staff_To_Hospital`
--

CREATE TABLE `Meeting_Schedule_By_Hospital_Staff_To_Hospital` (
  `meetingId` int(11) NOT NULL,
  `sendingHospitalStaffId` int(11) NOT NULL,
  `receivingHospitalId` int(11) NOT NULL,
  `meetingTitle` varchar(255) NOT NULL,
  `meetingAgenda` varchar(2000) NOT NULL,
  `meetingDate` datetime NOT NULL,
  `meetingTime` time NOT NULL,
  `isApproved` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Meeting_Schedule_By_Hospital_Staff_To_Insurance_Provider`
--

CREATE TABLE `Meeting_Schedule_By_Hospital_Staff_To_Insurance_Provider` (
  `meetingId` int(11) NOT NULL,
  `sendingHospitalStaffId` int(11) NOT NULL,
  `receivingInsuranceProviderId` int(11) NOT NULL,
  `meetingTitle` varchar(255) NOT NULL,
  `meetingAgenda` varchar(2000) NOT NULL,
  `meetingDate` datetime NOT NULL,
  `meetingTime` time NOT NULL,
  `isApproved` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Meeting_Schedule_By_Hospital_Staff_To_Patient`
--

CREATE TABLE `Meeting_Schedule_By_Hospital_Staff_To_Patient` (
  `meetingId` int(11) NOT NULL,
  `sendingHospitalStaffId` int(11) NOT NULL,
  `receivingPatientId` int(11) NOT NULL,
  `meetingTitle` varchar(255) NOT NULL,
  `meetingAgenda` varchar(2000) NOT NULL,
  `meetingDate` datetime NOT NULL,
  `meetingTime` time NOT NULL,
  `isApproved` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Meeting_Schedule_By_Hospital_To_Hospital_Staff`
--

CREATE TABLE `Meeting_Schedule_By_Hospital_To_Hospital_Staff` (
  `meetingId` int(11) NOT NULL,
  `sendingHospitalId` int(11) NOT NULL,
  `receivingHospitalStaffId` int(11) NOT NULL,
  `meetingTitle` varchar(255) NOT NULL,
  `meetingAgenda` varchar(2000) NOT NULL,
  `meetingDate` datetime NOT NULL,
  `meetingTime` time NOT NULL,
  `isApproved` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Meeting_Schedule_By_Hospital_To_Insurance_Provider`
--

CREATE TABLE `Meeting_Schedule_By_Hospital_To_Insurance_Provider` (
  `meetingId` int(11) NOT NULL,
  `sendingHospitalId` int(11) NOT NULL,
  `receivingInsuranceProviderId` int(11) NOT NULL,
  `meetingTitle` varchar(255) NOT NULL,
  `meetingAgenda` varchar(2000) NOT NULL,
  `meetingDate` datetime NOT NULL,
  `meetingTime` time NOT NULL,
  `isApproved` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Meeting_Schedule_By_Hospital_To_Patient`
--

CREATE TABLE `Meeting_Schedule_By_Hospital_To_Patient` (
  `meetingId` int(11) NOT NULL,
  `sendingHospitalId` int(11) NOT NULL,
  `receivingPatientId` int(11) NOT NULL,
  `meetingTitle` varchar(255) NOT NULL,
  `meetingAgenda` varchar(2000) NOT NULL,
  `meetingDate` datetime NOT NULL,
  `meetingTime` time NOT NULL,
  `isApproved` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Meeting_Schedule_By_Insurance_Provider_To_Hospital`
--

CREATE TABLE `Meeting_Schedule_By_Insurance_Provider_To_Hospital` (
  `meetingId` int(11) NOT NULL,
  `sendingInsuranceProviderId` int(11) NOT NULL,
  `receivingHospitalId` int(11) NOT NULL,
  `meetingTitle` varchar(255) NOT NULL,
  `meetingAgenda` varchar(2000) NOT NULL,
  `meetingDate` datetime NOT NULL,
  `meetingTime` time NOT NULL,
  `isApproved` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Meeting_Schedule_By_Insurance_Provider_To_Hospital_Staff`
--

CREATE TABLE `Meeting_Schedule_By_Insurance_Provider_To_Hospital_Staff` (
  `meetingId` int(11) NOT NULL,
  `sendingInsuranceProviderId` int(11) NOT NULL,
  `receivingHospitalStaffId` int(11) NOT NULL,
  `meetingTitle` varchar(255) NOT NULL,
  `meetingAgenda` varchar(2000) NOT NULL,
  `meetingDate` datetime NOT NULL,
  `meetingTime` time NOT NULL,
  `isApproved` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Meeting_Schedule_By_Insurance_Provider_To_Patient`
--

CREATE TABLE `Meeting_Schedule_By_Insurance_Provider_To_Patient` (
  `meetingId` int(11) NOT NULL,
  `sendingInsuranceProviderId` int(11) NOT NULL,
  `receivingPatientId` int(11) NOT NULL,
  `meetingTitle` varchar(255) NOT NULL,
  `meetingAgenda` varchar(2000) NOT NULL,
  `meetingDate` datetime NOT NULL,
  `meetingTime` time NOT NULL,
  `isApproved` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Meeting_Schedule_By_Patient_To_Hospital`
--

CREATE TABLE `Meeting_Schedule_By_Patient_To_Hospital` (
  `meetingId` int(11) NOT NULL,
  `sendingPatientId` int(11) NOT NULL,
  `receivingHospitalId` int(11) NOT NULL,
  `meetingTitle` varchar(255) NOT NULL,
  `meetingAgenda` varchar(2000) NOT NULL,
  `meetingDate` datetime NOT NULL,
  `meetingTime` time NOT NULL,
  `isApproved` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Meeting_Schedule_By_Patient_To_Hospital_Staff`
--

CREATE TABLE `Meeting_Schedule_By_Patient_To_Hospital_Staff` (
  `meetingId` int(11) NOT NULL,
  `sendingPatientId` int(11) NOT NULL,
  `receivingHospitalStaffId` int(11) NOT NULL,
  `meetingTitle` varchar(255) NOT NULL,
  `meetingAgenda` varchar(2000) NOT NULL,
  `meetingDate` datetime NOT NULL,
  `meetingTime` time NOT NULL,
  `isApproved` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Meeting_Schedule_By_Patient_To_Insurance_Provider`
--

CREATE TABLE `Meeting_Schedule_By_Patient_To_Insurance_Provider` (
  `meetingId` int(11) NOT NULL,
  `sendingPatientId` int(11) NOT NULL,
  `receivingInsuranceProviderId` int(11) NOT NULL,
  `meetingTitle` varchar(255) NOT NULL,
  `meetingAgenda` varchar(2000) NOT NULL,
  `meetingDate` datetime NOT NULL,
  `meetingTime` time NOT NULL,
  `isApproved` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Message_By_Hospital_Staff_To_Hospital`
--

CREATE TABLE `Message_By_Hospital_Staff_To_Hospital` (
  `messageId` int(11) NOT NULL,
  `sendingHospitalStaffId` int(11) NOT NULL,
  `receivingHospitalId` int(11) NOT NULL,
  `messageContent` varchar(2000) NOT NULL,
  `messageImage` varchar(200) DEFAULT NULL,
  `senderName` varchar(255) NOT NULL,
  `receiverName` varchar(255) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `receivedDate` datetime DEFAULT NULL,
  `isRead` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Message_By_Hospital_Staff_To_Insurance_Provider`
--

CREATE TABLE `Message_By_Hospital_Staff_To_Insurance_Provider` (
  `messageId` int(11) NOT NULL,
  `sendingHospitalStaffId` int(11) NOT NULL,
  `receivingInsuranceProviderId` int(11) NOT NULL,
  `messageContent` varchar(2000) NOT NULL,
  `messageImage` varchar(200) DEFAULT NULL,
  `senderName` varchar(255) NOT NULL,
  `receiverName` varchar(255) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `receivedDate` datetime DEFAULT NULL,
  `isRead` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Message_By_Hospital_Staff_To_Patient`
--

CREATE TABLE `Message_By_Hospital_Staff_To_Patient` (
  `messageId` int(11) NOT NULL,
  `sendingHospitalStaffId` int(11) NOT NULL,
  `receivingPatientId` int(11) NOT NULL,
  `messageContent` varchar(2000) NOT NULL,
  `messageImage` varchar(200) DEFAULT NULL,
  `senderName` varchar(255) NOT NULL,
  `receiverName` varchar(255) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `receivedDate` datetime DEFAULT NULL,
  `isRead` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Message_By_Hospital_To_Hospital_Staff`
--

CREATE TABLE `Message_By_Hospital_To_Hospital_Staff` (
  `messageId` int(11) NOT NULL,
  `sendingHospitalId` int(11) NOT NULL,
  `receivingHospitalStaffId` int(11) NOT NULL,
  `messageContent` varchar(2000) NOT NULL,
  `messageImage` varchar(2000) DEFAULT NULL,
  `senderName` varchar(255) NOT NULL,
  `receiverName` varchar(255) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `receivedDate` datetime DEFAULT NULL,
  `isRead` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Message_By_Hospital_To_Insurance_Provider`
--

CREATE TABLE `Message_By_Hospital_To_Insurance_Provider` (
  `messageId` int(11) NOT NULL,
  `sendingHospitalId` int(11) NOT NULL,
  `receivingInsuranceProviderId` int(11) NOT NULL,
  `messageContent` varchar(2000) NOT NULL,
  `messageImage` varchar(200) DEFAULT NULL,
  `senderName` varchar(255) NOT NULL,
  `receiverName` varchar(255) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `receivedDate` datetime DEFAULT NULL,
  `isRead` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Message_By_Hospital_To_Patient`
--

CREATE TABLE `Message_By_Hospital_To_Patient` (
  `messageId` int(11) NOT NULL,
  `sendingHospitalId` int(11) NOT NULL,
  `receivingPatientId` int(11) NOT NULL,
  `messageContent` varchar(2000) NOT NULL,
  `messageImage` varchar(200) DEFAULT NULL,
  `senderName` varchar(255) NOT NULL,
  `receiverName` varchar(255) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `receivedDate` datetime DEFAULT NULL,
  `isRead` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Message_By_Insurance_Provider_To_Hospital`
--

CREATE TABLE `Message_By_Insurance_Provider_To_Hospital` (
  `messageId` int(11) NOT NULL,
  `sendingInsuranceProviderId` int(11) NOT NULL,
  `receivingHospitalId` int(11) NOT NULL,
  `messageContent` varchar(2000) NOT NULL,
  `messageImage` varchar(200) DEFAULT NULL,
  `senderName` varchar(255) NOT NULL,
  `receiverName` varchar(255) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `receivedDate` datetime DEFAULT NULL,
  `isRead` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Message_By_Insurance_Provider_To_Hospital_Staff`
--

CREATE TABLE `Message_By_Insurance_Provider_To_Hospital_Staff` (
  `messageId` int(11) NOT NULL,
  `sendingInsuranceProviderId` int(11) NOT NULL,
  `receivingHospitalStaffId` int(11) NOT NULL,
  `messageContent` varchar(2000) NOT NULL,
  `messageImage` varchar(200) DEFAULT NULL,
  `senderName` varchar(255) NOT NULL,
  `receiverName` varchar(255) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `receivedDate` datetime DEFAULT NULL,
  `isRead` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Message_By_Insurance_Provider_To_Patient`
--

CREATE TABLE `Message_By_Insurance_Provider_To_Patient` (
  `messageId` int(11) NOT NULL,
  `sendingInsuranceProviderId` int(11) NOT NULL,
  `receivingPatientId` int(11) NOT NULL,
  `messageContent` varchar(2000) NOT NULL,
  `messageImage` varchar(200) DEFAULT NULL,
  `senderName` varchar(255) NOT NULL,
  `receiverName` varchar(255) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `receivedDate` datetime DEFAULT NULL,
  `isRead` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Message_By_Patient_To_Hospital`
--

CREATE TABLE `Message_By_Patient_To_Hospital` (
  `messageId` int(11) NOT NULL,
  `sendingPatientId` int(11) NOT NULL,
  `receivingHospitalId` int(11) NOT NULL,
  `messageContent` varchar(2000) NOT NULL,
  `messageImage` varchar(200) DEFAULT NULL,
  `senderName` varchar(255) NOT NULL,
  `receiverName` varchar(255) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `receivedDate` datetime DEFAULT NULL,
  `isRead` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Message_By_Patient_To_Hospital_Staff`
--

CREATE TABLE `Message_By_Patient_To_Hospital_Staff` (
  `messageId` int(11) NOT NULL,
  `sendingPatientId` int(11) NOT NULL,
  `receivingHospitalStaffId` int(11) NOT NULL,
  `messageContent` varchar(2000) NOT NULL,
  `messageImage` varchar(200) DEFAULT NULL,
  `senderName` varchar(255) NOT NULL,
  `receiverName` varchar(255) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `receivedDate` datetime DEFAULT NULL,
  `isRead` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Message_By_Patient_To_Insurance_Provider`
--

CREATE TABLE `Message_By_Patient_To_Insurance_Provider` (
  `messageId` int(11) NOT NULL,
  `sendingPatientId` int(11) NOT NULL,
  `receivingInsuranceProviderId` int(11) NOT NULL,
  `messageContent` varchar(2000) NOT NULL,
  `messageImage` varchar(200) DEFAULT NULL,
  `senderName` varchar(255) NOT NULL,
  `receiverName` varchar(255) NOT NULL,
  `sendDate` datetime DEFAULT current_timestamp(),
  `receivedDate` datetime DEFAULT NULL,
  `isRead` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Patients`
--

CREATE TABLE `Patients` (
  `patientId` int(11) NOT NULL,
  `hospitalId` int(11) NOT NULL,
  `patientName` varchar(255) NOT NULL,
  `patientEmail` varchar(255) NOT NULL,
  `patientAadhar` varchar(20) NOT NULL,
  `patientMobile` varchar(20) NOT NULL,
  `patientProfileImage` varchar(2000) NOT NULL,
  `patientIdProofImage` varchar(2000) NOT NULL,
  `patientAddress` varchar(500) NOT NULL,
  `patientGender` varchar(50) NOT NULL,
  `patientAge` int(11) NOT NULL,
  `patientPassword` varchar(2000) NOT NULL,
  `patientRegisteredDate` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedDate` datetime DEFAULT NULL,
  `passwordUpdatedStatus` int(11) NOT NULL DEFAULT 0,
  `isActive` int(11) NOT NULL DEFAULT 1,
  `deleteStatus` int(11) NOT NULL DEFAULT 0,
  `updatedStatus` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Payments`
--

CREATE TABLE `Payments` (
  `paymentId` int(11) NOT NULL,
  `billId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `insuranceProviderId` int(11) DEFAULT NULL,
  `hospitalId` int(11) NOT NULL,
  `razorPayPaymentId` varchar(255) NOT NULL,
  `razorPayOrderId` varchar(255) NOT NULL,
  `razorPayAmount` varchar(50) NOT NULL,
  `paymentDate` datetime DEFAULT current_timestamp(),
  `isSuccess` int(11) DEFAULT 1,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Reports`
--

CREATE TABLE `Reports` (
  `reportId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `insuranceProviderId` int(11) DEFAULT NULL,
  `hospitalId` int(11) NOT NULL,
  `hospitalStaffId` int(11) DEFAULT NULL,
  `reportMessage` varchar(2000) NOT NULL,
  `reporterName` varchar(255) NOT NULL,
  `reportedEntityName` varchar(255) NOT NULL,
  `reportReason` varchar(2000) NOT NULL,
  `reportImage` varchar(200) DEFAULT NULL,
  `reportReply` varchar(2000) DEFAULT NULL,
  `reportedDate` datetime DEFAULT current_timestamp(),
  `repliedDate` datetime DEFAULT NULL,
  `isRead` int(11) DEFAULT 0,
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Reviews`
--

CREATE TABLE `Reviews` (
  `reviewId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `insuranceProviderId` int(11) DEFAULT NULL,
  `hospitalId` int(11) NOT NULL,
  `hospitalStaffId` int(11) DEFAULT NULL,
  `reviewContent` varchar(2000) NOT NULL,
  `reviewerName` varchar(255) NOT NULL,
  `reviewedEntityName` varchar(255) NOT NULL,
  `reviewDate` datetime DEFAULT current_timestamp(),
  `deleteStatus` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Bills`
--
ALTER TABLE `Bills`
  ADD PRIMARY KEY (`billId`),
  ADD KEY `patientId` (`patientId`),
  ADD KEY `insuranceProviderId` (`insuranceProviderId`),
  ADD KEY `hospitalId` (`hospitalId`);

--
-- Indexes for table `Hospitals`
--
ALTER TABLE `Hospitals`
  ADD PRIMARY KEY (`hospitalId`);

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
  ADD KEY `hospitalId` (`hospitalId`);

--
-- Indexes for table `Insurance_Details`
--
ALTER TABLE `Insurance_Details`
  ADD PRIMARY KEY (`insuranceId`),
  ADD KEY `insuranceProviderId` (`insuranceProviderId`),
  ADD KEY `patientId` (`patientId`),
  ADD KEY `hospitalId` (`hospitalId`);

--
-- Indexes for table `Insurance_Providers`
--
ALTER TABLE `Insurance_Providers`
  ADD PRIMARY KEY (`insuranceProviderId`),
  ADD KEY `hospitalId` (`hospitalId`);

--
-- Indexes for table `Lab_Results`
--
ALTER TABLE `Lab_Results`
  ADD PRIMARY KEY (`labResultId`),
  ADD KEY `patientId` (`patientId`),
  ADD KEY `insuranceProviderId` (`insuranceProviderId`),
  ADD KEY `hospitalId` (`hospitalId`),
  ADD KEY `hospitalStaffId` (`hospitalStaffId`);

--
-- Indexes for table `Medical_Conditions`
--
ALTER TABLE `Medical_Conditions`
  ADD PRIMARY KEY (`medicalConditionId`),
  ADD KEY `patientId` (`patientId`),
  ADD KEY `insuranceProviderId` (`insuranceProviderId`),
  ADD KEY `hospitalId` (`hospitalId`),
  ADD KEY `hospitalStaffId` (`hospitalStaffId`);

--
-- Indexes for table `Meeting_Schedule_By_Hospital_Staff_To_Hospital`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_Staff_To_Hospital`
  ADD PRIMARY KEY (`meetingId`),
  ADD KEY `fk_hospital_staff_to_hospital` (`sendingHospitalStaffId`),
  ADD KEY `fk_hospital_from_hospital_staff` (`receivingHospitalId`);

--
-- Indexes for table `Meeting_Schedule_By_Hospital_Staff_To_Insurance_Provider`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_Staff_To_Insurance_Provider`
  ADD PRIMARY KEY (`meetingId`),
  ADD KEY `fk_hospital_staff_to_insurance_provider` (`sendingHospitalStaffId`),
  ADD KEY `fk_insurance_provider_from_hospital_staff` (`receivingInsuranceProviderId`);

--
-- Indexes for table `Meeting_Schedule_By_Hospital_Staff_To_Patient`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_Staff_To_Patient`
  ADD PRIMARY KEY (`meetingId`),
  ADD KEY `fk_hospital_staff_to_patient` (`sendingHospitalStaffId`),
  ADD KEY `fk_patient_from_hospital_staff` (`receivingPatientId`);

--
-- Indexes for table `Meeting_Schedule_By_Hospital_To_Hospital_Staff`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_To_Hospital_Staff`
  ADD PRIMARY KEY (`meetingId`),
  ADD KEY `fk_hospital_to_hospital_staff` (`sendingHospitalId`),
  ADD KEY `fk_hospital_staff_from_hospital` (`receivingHospitalStaffId`);

--
-- Indexes for table `Meeting_Schedule_By_Hospital_To_Insurance_Provider`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_To_Insurance_Provider`
  ADD PRIMARY KEY (`meetingId`),
  ADD KEY `fk_hospital_to_insurance_provider` (`sendingHospitalId`),
  ADD KEY `fk_insurance_provider_from_hospital` (`receivingInsuranceProviderId`);

--
-- Indexes for table `Meeting_Schedule_By_Hospital_To_Patient`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_To_Patient`
  ADD PRIMARY KEY (`meetingId`),
  ADD KEY `fk_hospital_to_patient` (`sendingHospitalId`),
  ADD KEY `fk_patient_from_hospital` (`receivingPatientId`);

--
-- Indexes for table `Meeting_Schedule_By_Insurance_Provider_To_Hospital`
--
ALTER TABLE `Meeting_Schedule_By_Insurance_Provider_To_Hospital`
  ADD PRIMARY KEY (`meetingId`),
  ADD KEY `fk_insurance_provider_to_hospital` (`sendingInsuranceProviderId`),
  ADD KEY `fk_hospital_from_insurance_provider` (`receivingHospitalId`);

--
-- Indexes for table `Meeting_Schedule_By_Insurance_Provider_To_Hospital_Staff`
--
ALTER TABLE `Meeting_Schedule_By_Insurance_Provider_To_Hospital_Staff`
  ADD PRIMARY KEY (`meetingId`),
  ADD KEY `fk_insurance_provider_to_hospital_staff` (`sendingInsuranceProviderId`),
  ADD KEY `fk_hospital_staff_from_insurance_provider` (`receivingHospitalStaffId`);

--
-- Indexes for table `Meeting_Schedule_By_Insurance_Provider_To_Patient`
--
ALTER TABLE `Meeting_Schedule_By_Insurance_Provider_To_Patient`
  ADD PRIMARY KEY (`meetingId`),
  ADD KEY `fk_insurance_provider_to_patient` (`sendingInsuranceProviderId`),
  ADD KEY `fk_patient_from_insurance_provider` (`receivingPatientId`);

--
-- Indexes for table `Meeting_Schedule_By_Patient_To_Hospital`
--
ALTER TABLE `Meeting_Schedule_By_Patient_To_Hospital`
  ADD PRIMARY KEY (`meetingId`),
  ADD KEY `fk_patient_to_hospital` (`sendingPatientId`),
  ADD KEY `fk_hospital_from_patient` (`receivingHospitalId`);

--
-- Indexes for table `Meeting_Schedule_By_Patient_To_Hospital_Staff`
--
ALTER TABLE `Meeting_Schedule_By_Patient_To_Hospital_Staff`
  ADD PRIMARY KEY (`meetingId`),
  ADD KEY `fk_patient_to_hospital_staff` (`sendingPatientId`),
  ADD KEY `fk_hospital_staff_from_patient` (`receivingHospitalStaffId`);

--
-- Indexes for table `Meeting_Schedule_By_Patient_To_Insurance_Provider`
--
ALTER TABLE `Meeting_Schedule_By_Patient_To_Insurance_Provider`
  ADD PRIMARY KEY (`meetingId`),
  ADD KEY `fk_patient_to_insurance_provider` (`sendingPatientId`),
  ADD KEY `fk_insurance_provider_from_patient` (`receivingInsuranceProviderId`);

--
-- Indexes for table `Message_By_Hospital_Staff_To_Hospital`
--
ALTER TABLE `Message_By_Hospital_Staff_To_Hospital`
  ADD PRIMARY KEY (`messageId`),
  ADD KEY `fk_sending_hospital_staff_to_hospital` (`sendingHospitalStaffId`),
  ADD KEY `fk_receiving_hospital_from_hospital_staff` (`receivingHospitalId`);

--
-- Indexes for table `Message_By_Hospital_Staff_To_Insurance_Provider`
--
ALTER TABLE `Message_By_Hospital_Staff_To_Insurance_Provider`
  ADD PRIMARY KEY (`messageId`),
  ADD KEY `fk_sending_hospital_staff_to_insurance_provider` (`sendingHospitalStaffId`),
  ADD KEY `fk_receiving_insurance_provider_from_hospital_staff` (`receivingInsuranceProviderId`);

--
-- Indexes for table `Message_By_Hospital_Staff_To_Patient`
--
ALTER TABLE `Message_By_Hospital_Staff_To_Patient`
  ADD PRIMARY KEY (`messageId`),
  ADD KEY `fk_sending_hospital_staff_to_patient` (`sendingHospitalStaffId`),
  ADD KEY `fk_receiving_patient_from_hospital_staff` (`receivingPatientId`);

--
-- Indexes for table `Message_By_Hospital_To_Hospital_Staff`
--
ALTER TABLE `Message_By_Hospital_To_Hospital_Staff`
  ADD PRIMARY KEY (`messageId`),
  ADD KEY `fk_sending_hospital_to_hospital_staff` (`sendingHospitalId`),
  ADD KEY `fk_receiving_hospital_staff_from_hospital` (`receivingHospitalStaffId`);

--
-- Indexes for table `Message_By_Hospital_To_Insurance_Provider`
--
ALTER TABLE `Message_By_Hospital_To_Insurance_Provider`
  ADD PRIMARY KEY (`messageId`),
  ADD KEY `fk_sending_hospital_to_insurance_provider` (`sendingHospitalId`),
  ADD KEY `fk_receiving_insurance_provider_from_hospital` (`receivingInsuranceProviderId`);

--
-- Indexes for table `Message_By_Hospital_To_Patient`
--
ALTER TABLE `Message_By_Hospital_To_Patient`
  ADD PRIMARY KEY (`messageId`),
  ADD KEY `fk_sending_hospital_to_patient` (`sendingHospitalId`),
  ADD KEY `fk_receiving_patient_from_hospital` (`receivingPatientId`);

--
-- Indexes for table `Message_By_Insurance_Provider_To_Hospital`
--
ALTER TABLE `Message_By_Insurance_Provider_To_Hospital`
  ADD PRIMARY KEY (`messageId`),
  ADD KEY `fk_sending_insurance_provider_to_hospital` (`sendingInsuranceProviderId`),
  ADD KEY `fk_receiving_hospital_from_insurance_provider` (`receivingHospitalId`);

--
-- Indexes for table `Message_By_Insurance_Provider_To_Hospital_Staff`
--
ALTER TABLE `Message_By_Insurance_Provider_To_Hospital_Staff`
  ADD PRIMARY KEY (`messageId`),
  ADD KEY `fk_sending_insurance_provider_to_hospital_staff` (`sendingInsuranceProviderId`),
  ADD KEY `fk_receiving_hospital_staff_from_inusrance_provider` (`receivingHospitalStaffId`);

--
-- Indexes for table `Message_By_Insurance_Provider_To_Patient`
--
ALTER TABLE `Message_By_Insurance_Provider_To_Patient`
  ADD PRIMARY KEY (`messageId`),
  ADD KEY `fk_sending_insurance_provider_to_patient` (`sendingInsuranceProviderId`),
  ADD KEY `fk_receiving_patient_from_insurance_provider` (`receivingPatientId`);

--
-- Indexes for table `Message_By_Patient_To_Hospital`
--
ALTER TABLE `Message_By_Patient_To_Hospital`
  ADD PRIMARY KEY (`messageId`),
  ADD KEY `fk_sending_patient_to_hospital` (`sendingPatientId`),
  ADD KEY `fk_receiving_hospital_from_patient` (`receivingHospitalId`);

--
-- Indexes for table `Message_By_Patient_To_Hospital_Staff`
--
ALTER TABLE `Message_By_Patient_To_Hospital_Staff`
  ADD PRIMARY KEY (`messageId`),
  ADD KEY `fk_sending_patient_to_hospital_staff` (`sendingPatientId`),
  ADD KEY `fk_receiving_hospital_staff_from_patient` (`receivingHospitalStaffId`);

--
-- Indexes for table `Message_By_Patient_To_Insurance_Provider`
--
ALTER TABLE `Message_By_Patient_To_Insurance_Provider`
  ADD PRIMARY KEY (`messageId`),
  ADD KEY `fk_sending_patient_to_insurance_provider` (`sendingPatientId`),
  ADD KEY `fk_receiving_insurance_provider_from_patient` (`receivingInsuranceProviderId`);

--
-- Indexes for table `Patients`
--
ALTER TABLE `Patients`
  ADD PRIMARY KEY (`patientId`),
  ADD KEY `hospitalId` (`hospitalId`);

--
-- Indexes for table `Payments`
--
ALTER TABLE `Payments`
  ADD PRIMARY KEY (`paymentId`),
  ADD KEY `billId` (`billId`),
  ADD KEY `patientId` (`patientId`),
  ADD KEY `insuranceProviderId` (`insuranceProviderId`),
  ADD KEY `hospitalId` (`hospitalId`);

--
-- Indexes for table `Reports`
--
ALTER TABLE `Reports`
  ADD PRIMARY KEY (`reportId`),
  ADD KEY `patientId` (`patientId`),
  ADD KEY `insuranceProviderId` (`insuranceProviderId`),
  ADD KEY `hospitalId` (`hospitalId`),
  ADD KEY `hospitalStaffId` (`hospitalStaffId`);

--
-- Indexes for table `Reviews`
--
ALTER TABLE `Reviews`
  ADD PRIMARY KEY (`reviewId`),
  ADD KEY `patientId` (`patientId`),
  ADD KEY `insuranceProviderId` (`insuranceProviderId`),
  ADD KEY `hospitalId` (`hospitalId`),
  ADD KEY `hospitalStaffId` (`hospitalStaffId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Bills`
--
ALTER TABLE `Bills`
  MODIFY `billId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Hospitals`
--
ALTER TABLE `Hospitals`
  MODIFY `hospitalId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Hospital_News`
--
ALTER TABLE `Hospital_News`
  MODIFY `hospitalNewsId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Hospital_Staffs`
--
ALTER TABLE `Hospital_Staffs`
  MODIFY `hospitalStaffId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Insurance_Details`
--
ALTER TABLE `Insurance_Details`
  MODIFY `insuranceId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Insurance_Providers`
--
ALTER TABLE `Insurance_Providers`
  MODIFY `insuranceProviderId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Lab_Results`
--
ALTER TABLE `Lab_Results`
  MODIFY `labResultId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Medical_Conditions`
--
ALTER TABLE `Medical_Conditions`
  MODIFY `medicalConditionId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Meeting_Schedule_By_Hospital_Staff_To_Hospital`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_Staff_To_Hospital`
  MODIFY `meetingId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Meeting_Schedule_By_Hospital_Staff_To_Insurance_Provider`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_Staff_To_Insurance_Provider`
  MODIFY `meetingId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Meeting_Schedule_By_Hospital_Staff_To_Patient`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_Staff_To_Patient`
  MODIFY `meetingId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Meeting_Schedule_By_Hospital_To_Hospital_Staff`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_To_Hospital_Staff`
  MODIFY `meetingId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Meeting_Schedule_By_Hospital_To_Insurance_Provider`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_To_Insurance_Provider`
  MODIFY `meetingId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Meeting_Schedule_By_Hospital_To_Patient`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_To_Patient`
  MODIFY `meetingId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Meeting_Schedule_By_Insurance_Provider_To_Hospital`
--
ALTER TABLE `Meeting_Schedule_By_Insurance_Provider_To_Hospital`
  MODIFY `meetingId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Meeting_Schedule_By_Insurance_Provider_To_Hospital_Staff`
--
ALTER TABLE `Meeting_Schedule_By_Insurance_Provider_To_Hospital_Staff`
  MODIFY `meetingId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Meeting_Schedule_By_Insurance_Provider_To_Patient`
--
ALTER TABLE `Meeting_Schedule_By_Insurance_Provider_To_Patient`
  MODIFY `meetingId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Meeting_Schedule_By_Patient_To_Hospital`
--
ALTER TABLE `Meeting_Schedule_By_Patient_To_Hospital`
  MODIFY `meetingId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Meeting_Schedule_By_Patient_To_Hospital_Staff`
--
ALTER TABLE `Meeting_Schedule_By_Patient_To_Hospital_Staff`
  MODIFY `meetingId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Meeting_Schedule_By_Patient_To_Insurance_Provider`
--
ALTER TABLE `Meeting_Schedule_By_Patient_To_Insurance_Provider`
  MODIFY `meetingId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Message_By_Hospital_Staff_To_Hospital`
--
ALTER TABLE `Message_By_Hospital_Staff_To_Hospital`
  MODIFY `messageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Message_By_Hospital_Staff_To_Insurance_Provider`
--
ALTER TABLE `Message_By_Hospital_Staff_To_Insurance_Provider`
  MODIFY `messageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Message_By_Hospital_Staff_To_Patient`
--
ALTER TABLE `Message_By_Hospital_Staff_To_Patient`
  MODIFY `messageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Message_By_Hospital_To_Hospital_Staff`
--
ALTER TABLE `Message_By_Hospital_To_Hospital_Staff`
  MODIFY `messageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Message_By_Hospital_To_Insurance_Provider`
--
ALTER TABLE `Message_By_Hospital_To_Insurance_Provider`
  MODIFY `messageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Message_By_Hospital_To_Patient`
--
ALTER TABLE `Message_By_Hospital_To_Patient`
  MODIFY `messageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Message_By_Insurance_Provider_To_Hospital`
--
ALTER TABLE `Message_By_Insurance_Provider_To_Hospital`
  MODIFY `messageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Message_By_Insurance_Provider_To_Hospital_Staff`
--
ALTER TABLE `Message_By_Insurance_Provider_To_Hospital_Staff`
  MODIFY `messageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Message_By_Insurance_Provider_To_Patient`
--
ALTER TABLE `Message_By_Insurance_Provider_To_Patient`
  MODIFY `messageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Message_By_Patient_To_Hospital`
--
ALTER TABLE `Message_By_Patient_To_Hospital`
  MODIFY `messageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Message_By_Patient_To_Hospital_Staff`
--
ALTER TABLE `Message_By_Patient_To_Hospital_Staff`
  MODIFY `messageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Message_By_Patient_To_Insurance_Provider`
--
ALTER TABLE `Message_By_Patient_To_Insurance_Provider`
  MODIFY `messageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Patients`
--
ALTER TABLE `Patients`
  MODIFY `patientId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Payments`
--
ALTER TABLE `Payments`
  MODIFY `paymentId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Reports`
--
ALTER TABLE `Reports`
  MODIFY `reportId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Reviews`
--
ALTER TABLE `Reviews`
  MODIFY `reviewId` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Bills`
--
ALTER TABLE `Bills`
  ADD CONSTRAINT `bills_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE,
  ADD CONSTRAINT `bills_ibfk_2` FOREIGN KEY (`insuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `bills_ibfk_3` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

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
-- Constraints for table `Insurance_Details`
--
ALTER TABLE `Insurance_Details`
  ADD CONSTRAINT `insurance_details_ibfk_1` FOREIGN KEY (`insuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `insurance_details_ibfk_2` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE,
  ADD CONSTRAINT `insurance_details_ibfk_3` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Insurance_Providers`
--
ALTER TABLE `Insurance_Providers`
  ADD CONSTRAINT `insurance_providers_ibfk_1` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Lab_Results`
--
ALTER TABLE `Lab_Results`
  ADD CONSTRAINT `lab_results_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE,
  ADD CONSTRAINT `lab_results_ibfk_2` FOREIGN KEY (`insuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `lab_results_ibfk_3` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `lab_results_ibfk_4` FOREIGN KEY (`hospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE;

--
-- Constraints for table `Medical_Conditions`
--
ALTER TABLE `Medical_Conditions`
  ADD CONSTRAINT `medical_conditions_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE,
  ADD CONSTRAINT `medical_conditions_ibfk_2` FOREIGN KEY (`insuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `medical_conditions_ibfk_3` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `medical_conditions_ibfk_4` FOREIGN KEY (`hospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE;

--
-- Constraints for table `Meeting_Schedule_By_Hospital_Staff_To_Hospital`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_Staff_To_Hospital`
  ADD CONSTRAINT `fk_hospital_from_hospital_staff` FOREIGN KEY (`receivingHospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_hospital_staff_to_hospital` FOREIGN KEY (`sendingHospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE;

--
-- Constraints for table `Meeting_Schedule_By_Hospital_Staff_To_Insurance_Provider`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_Staff_To_Insurance_Provider`
  ADD CONSTRAINT `fk_hospital_staff_to_insurance_provider` FOREIGN KEY (`sendingHospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_insurance_provider_from_hospital_staff` FOREIGN KEY (`receivingInsuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE;

--
-- Constraints for table `Meeting_Schedule_By_Hospital_Staff_To_Patient`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_Staff_To_Patient`
  ADD CONSTRAINT `fk_hospital_staff_to_patient` FOREIGN KEY (`sendingHospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_patient_from_hospital_staff` FOREIGN KEY (`receivingPatientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE;

--
-- Constraints for table `Meeting_Schedule_By_Hospital_To_Hospital_Staff`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_To_Hospital_Staff`
  ADD CONSTRAINT `fk_hospital_staff_from_hospital` FOREIGN KEY (`receivingHospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_hospital_to_hospital_staff` FOREIGN KEY (`sendingHospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Meeting_Schedule_By_Hospital_To_Insurance_Provider`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_To_Insurance_Provider`
  ADD CONSTRAINT `fk_hospital_to_insurance_provider` FOREIGN KEY (`sendingHospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_insurance_provider_from_hospital` FOREIGN KEY (`receivingInsuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE;

--
-- Constraints for table `Meeting_Schedule_By_Hospital_To_Patient`
--
ALTER TABLE `Meeting_Schedule_By_Hospital_To_Patient`
  ADD CONSTRAINT `fk_hospital_to_patient` FOREIGN KEY (`sendingHospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_patient_from_hospital` FOREIGN KEY (`receivingPatientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE;

--
-- Constraints for table `Meeting_Schedule_By_Insurance_Provider_To_Hospital`
--
ALTER TABLE `Meeting_Schedule_By_Insurance_Provider_To_Hospital`
  ADD CONSTRAINT `fk_hospital_from_insurance_provider` FOREIGN KEY (`receivingHospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_insurance_provider_to_hospital` FOREIGN KEY (`sendingInsuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE;

--
-- Constraints for table `Meeting_Schedule_By_Insurance_Provider_To_Hospital_Staff`
--
ALTER TABLE `Meeting_Schedule_By_Insurance_Provider_To_Hospital_Staff`
  ADD CONSTRAINT `fk_hospital_staff_from_insurance_provider` FOREIGN KEY (`receivingHospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_insurance_provider_to_hospital_staff` FOREIGN KEY (`sendingInsuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE;

--
-- Constraints for table `Meeting_Schedule_By_Insurance_Provider_To_Patient`
--
ALTER TABLE `Meeting_Schedule_By_Insurance_Provider_To_Patient`
  ADD CONSTRAINT `fk_insurance_provider_to_patient` FOREIGN KEY (`sendingInsuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_patient_from_insurance_provider` FOREIGN KEY (`receivingPatientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE;

--
-- Constraints for table `Meeting_Schedule_By_Patient_To_Hospital`
--
ALTER TABLE `Meeting_Schedule_By_Patient_To_Hospital`
  ADD CONSTRAINT `fk_hospital_from_patient` FOREIGN KEY (`receivingHospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_patient_to_hospital` FOREIGN KEY (`sendingPatientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE;

--
-- Constraints for table `Meeting_Schedule_By_Patient_To_Hospital_Staff`
--
ALTER TABLE `Meeting_Schedule_By_Patient_To_Hospital_Staff`
  ADD CONSTRAINT `fk_hospital_staff_from_patient` FOREIGN KEY (`receivingHospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_patient_to_hospital_staff` FOREIGN KEY (`sendingPatientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE;

--
-- Constraints for table `Meeting_Schedule_By_Patient_To_Insurance_Provider`
--
ALTER TABLE `Meeting_Schedule_By_Patient_To_Insurance_Provider`
  ADD CONSTRAINT `fk_insurance_provider_from_patient` FOREIGN KEY (`receivingInsuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_patient_to_insurance_provider` FOREIGN KEY (`sendingPatientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE;

--
-- Constraints for table `Message_By_Hospital_Staff_To_Hospital`
--
ALTER TABLE `Message_By_Hospital_Staff_To_Hospital`
  ADD CONSTRAINT `fk_receiving_hospital_from_hospital_staff` FOREIGN KEY (`receivingHospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sending_hospital_staff_to_hospital` FOREIGN KEY (`sendingHospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE;

--
-- Constraints for table `Message_By_Hospital_Staff_To_Insurance_Provider`
--
ALTER TABLE `Message_By_Hospital_Staff_To_Insurance_Provider`
  ADD CONSTRAINT `fk_receiving_insurance_provider_from_hospital_staff` FOREIGN KEY (`receivingInsuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sending_hospital_staff_to_insurance_provider` FOREIGN KEY (`sendingHospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE;

--
-- Constraints for table `Message_By_Hospital_Staff_To_Patient`
--
ALTER TABLE `Message_By_Hospital_Staff_To_Patient`
  ADD CONSTRAINT `fk_receiving_patient_from_hospital_staff` FOREIGN KEY (`receivingPatientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sending_hospital_staff_to_patient` FOREIGN KEY (`sendingHospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE;

--
-- Constraints for table `Message_By_Hospital_To_Hospital_Staff`
--
ALTER TABLE `Message_By_Hospital_To_Hospital_Staff`
  ADD CONSTRAINT `fk_receiving_hospital_staff_from_hospital` FOREIGN KEY (`receivingHospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sending_hospital_to_hospital_staff` FOREIGN KEY (`sendingHospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Message_By_Hospital_To_Insurance_Provider`
--
ALTER TABLE `Message_By_Hospital_To_Insurance_Provider`
  ADD CONSTRAINT `fk_receiving_insurance_provider_from_hospital` FOREIGN KEY (`receivingInsuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sending_hospital_to_insurance_provider` FOREIGN KEY (`sendingHospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Message_By_Hospital_To_Patient`
--
ALTER TABLE `Message_By_Hospital_To_Patient`
  ADD CONSTRAINT `fk_receiving_patient_from_hospital` FOREIGN KEY (`receivingPatientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sending_hospital_to_patient` FOREIGN KEY (`sendingHospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Message_By_Insurance_Provider_To_Hospital`
--
ALTER TABLE `Message_By_Insurance_Provider_To_Hospital`
  ADD CONSTRAINT `fk_receiving_hospital_from_insurance_provider` FOREIGN KEY (`receivingHospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sending_insurance_provider_to_hospital` FOREIGN KEY (`sendingInsuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE;

--
-- Constraints for table `Message_By_Insurance_Provider_To_Hospital_Staff`
--
ALTER TABLE `Message_By_Insurance_Provider_To_Hospital_Staff`
  ADD CONSTRAINT `fk_receiving_hospital_staff_from_inusrance_provider` FOREIGN KEY (`receivingHospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sending_insurance_provider_to_hospital_staff` FOREIGN KEY (`sendingInsuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE;

--
-- Constraints for table `Message_By_Insurance_Provider_To_Patient`
--
ALTER TABLE `Message_By_Insurance_Provider_To_Patient`
  ADD CONSTRAINT `fk_receiving_patient_from_insurance_provider` FOREIGN KEY (`receivingPatientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sending_insurance_provider_to_patient` FOREIGN KEY (`sendingInsuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE;

--
-- Constraints for table `Message_By_Patient_To_Hospital`
--
ALTER TABLE `Message_By_Patient_To_Hospital`
  ADD CONSTRAINT `fk_receiving_hospital_from_patient` FOREIGN KEY (`receivingHospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sending_patient_to_hospital` FOREIGN KEY (`sendingPatientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE;

--
-- Constraints for table `Message_By_Patient_To_Hospital_Staff`
--
ALTER TABLE `Message_By_Patient_To_Hospital_Staff`
  ADD CONSTRAINT `fk_receiving_hospital_staff_from_patient` FOREIGN KEY (`receivingHospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sending_patient_to_hospital_staff` FOREIGN KEY (`sendingPatientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE;

--
-- Constraints for table `Message_By_Patient_To_Insurance_Provider`
--
ALTER TABLE `Message_By_Patient_To_Insurance_Provider`
  ADD CONSTRAINT `fk_receiving_insurance_provider_from_patient` FOREIGN KEY (`receivingInsuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sending_patient_to_insurance_provider` FOREIGN KEY (`sendingPatientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE;

--
-- Constraints for table `Patients`
--
ALTER TABLE `Patients`
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Payments`
--
ALTER TABLE `Payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`billId`) REFERENCES `Bills` (`billId`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`insuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_4` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE;

--
-- Constraints for table `Reports`
--
ALTER TABLE `Reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE,
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`insuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `reports_ibfk_3` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `reports_ibfk_4` FOREIGN KEY (`hospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE;

--
-- Constraints for table `Reviews`
--
ALTER TABLE `Reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`patientId`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`insuranceProviderId`) REFERENCES `Insurance_Providers` (`insuranceProviderId`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`hospitalId`) REFERENCES `Hospitals` (`hospitalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_4` FOREIGN KEY (`hospitalStaffId`) REFERENCES `Hospital_Staffs` (`hospitalStaffId`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
