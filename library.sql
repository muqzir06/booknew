-- Library Management System Database Schema
-- Database Name: library_db

CREATE DATABASE IF NOT EXISTS `library_db`;
USE `library_db`;

-- 1. Table structure for table `admins`
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table structure for table `books`
CREATE TABLE IF NOT EXISTS `books` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `author` VARCHAR(100) NOT NULL,
  `isbn` VARCHAR(20) UNIQUE NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `available_qty` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table structure for table `students`
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` VARCHAR(20) UNIQUE NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `phone` VARCHAR(15) NOT NULL,
  `department` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table structure for table `issued_books`
CREATE TABLE IF NOT EXISTS `issued_books` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `book_id` INT,
  `student_id` INT,
  `issue_date` DATE NOT NULL,
  `return_date` DATE NOT NULL,
  `actual_return_date` DATE DEFAULT NULL,
  `fine_amount` DECIMAL(10,2) DEFAULT 0.00,
  `status` ENUM('Issued', 'Returned') DEFAULT 'Issued',
  FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Dumping data for tables
-- --------------------------------------------------------

-- Default Admin Account (Username: admin, Password: admin123)
-- Password hash generated using Werkzeug security functions
INSERT INTO `admins` (`id`, `username`, `password`, `full_name`) VALUES
(1, 'admin', 'scrypt:32768:8:1$rj8Lt6EkX4Vhj1Mq$111e1b1e1c60873c12c8996f1a2581a1c0cb6e52ad72b8ccb551f12da0623c7031a418f31037a604bf8bea0be086491d10a0e422e3f27265b43b687fd840e13b', 'System Administrator')
ON DUPLICATE KEY UPDATE `full_name`='System Administrator';

-- Sample Students
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `phone`, `department`, `created_at`) VALUES
(1, 'STU001', 'Alice Johnson', 'alice@university.edu', '9876543210', 'Computer Science', CURRENT_TIMESTAMP),
(2, 'STU002', 'Bob Smith', 'bob@university.edu', '8765432109', 'Mechanical Engineering', CURRENT_TIMESTAMP),
(3, 'STU003', 'Charlie Brown', 'charlie@university.edu', '7654321098', 'Electronics & Communication', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Sample Books
INSERT INTO `books` (`id`, `title`, `author`, `isbn`, `category`, `quantity`, `available_qty`, `created_at`) VALUES
(1, 'Introduction to Algorithms', 'Thomas H. Cormen', '978-0262033848', 'Computer Science', 5, 4, CURRENT_TIMESTAMP),
(2, 'Clean Code', 'Robert C. Martin', '978-0132350884', 'Software Engineering', 3, 3, CURRENT_TIMESTAMP),
(3, 'The Pragmatic Programmer', 'Andrew Hunt', '978-0135957059', 'Software Engineering', 4, 3, CURRENT_TIMESTAMP),
(4, 'Database System Concepts', 'Abraham Silberschatz', '978-9332901384', 'Database Management', 2, 2, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- Sample Issued Books
-- Alice Johnson (student_id = 1) has issued 'Introduction to Algorithms' (book_id = 1)
-- Due date is set, say, 14 days from issue date.
INSERT INTO `issued_books` (`id`, `book_id`, `student_id`, `issue_date`, `return_date`, `actual_return_date`, `fine_amount`, `status`) VALUES
(1, 1, 1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 9 DAY), NULL, 0.00, 'Issued'),
(2, 3, 2, DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_SUB(CURDATE(), INTERVAL 1 DAY), NULL, 10.00, 'Issued') -- Overdue book by 1 day
ON DUPLICATE KEY UPDATE `fine_amount`=VALUES(`fine_amount`);
