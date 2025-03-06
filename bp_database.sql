USE BloodPressureDB;
GO

-- יצירת הטבלה
CREATE TABLE measurements (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId NVARCHAR(50) NOT NULL,
    systolic INT NOT NULL,
    diastolic INT NOT NULL,
    pulse INT,
    date DATETIME NOT NULL
);

-- הוספת נתונים לדוגמה
INSERT INTO measurements (userId, systolic, diastolic, pulse, date) VALUES
('user1', 120, 80, 72, '2023-11-01 10:00:00'),
('user1', 160, 100, 78, '2023-11-15 14:30:00'),
('user1', 100, 70, 68, '2023-11-20 09:15:00'),
('user2', 130, 85, 70, '2023-11-05 12:00:00'),
('user2', 140, 90, 75, '2023-11-25 16:45:00'),
('user3', 115, 75, 65, '2023-11-10 08:30:00');