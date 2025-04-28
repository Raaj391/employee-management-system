-- Employee Management System Database Structure
-- Compatible with MySQL/MariaDB for Hostinger

-- Drop tables if they exist to avoid errors
DROP TABLE IF EXISTS salaries;
DROP TABLE IF EXISTS rejected_surveys;
DROP TABLE IF EXISTS survey_work;
DROP TABLE IF EXISTS leave_applications;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS session;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phoneNumber VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'employee',
    dailySalary DECIMAL(10, 2),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    date DATE NOT NULL,
    checkInTime TIME,
    checkOutTime TIME,
    status VARCHAR(50) DEFAULT 'present',
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create survey_work table
CREATE TABLE survey_work (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    date DATE NOT NULL,
    surveyType VARCHAR(50) NOT NULL,
    completedCount INT NOT NULL,
    rate DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create rejected_surveys table
CREATE TABLE rejected_surveys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    month VARCHAR(7) NOT NULL,
    surveyType VARCHAR(50) NOT NULL,
    rejectedCount INT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create leave_applications table
CREATE TABLE leave_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create salaries table
CREATE TABLE salaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    month VARCHAR(7) NOT NULL,
    grossAmount DECIMAL(10, 2) NOT NULL,
    rejectedSurveyDeduction DECIMAL(10, 2) DEFAULT 0,
    leaveDeduction DECIMAL(10, 2) DEFAULT 0,
    netAmount DECIMAL(10, 2) NOT NULL,
    calculatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create session table for storing user sessions
CREATE TABLE session (
    sid VARCHAR(255) PRIMARY KEY,
    sess TEXT NOT NULL,
    expired TIMESTAMP NOT NULL
);

-- Insert default admin user
INSERT INTO users (username, password, fullName, role, email, phoneNumber)
VALUES ('admin', '5dca0b8c9f339d020526b4e53a9de6480f861ce84317a71327404e8fc49ab0ed.3ee502ec90e5f3f2752eb33134a41629', 'System Administrator', 'admin', 'admin@example.com', '1234567890');

-- Note: The password is 'admin123' encrypted for security
-- If you need to change it, you'll need to generate a new hash using scrypt