CREATE TABLE [dbo].[user] (
    [user_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [first_name] VARCHAR(255) NOT NULL,
    [last_name] VARCHAR(255) NOT NULL,
    [degree] VARCHAR(255) NOT NULL,
    [year] VARCHAR(255) NOT NULL,
    [email] VARCHAR(255) NOT NULL,
    [phone] VARCHAR(255) NOT NULL
);