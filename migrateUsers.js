require("dotenv").config();

const mysql = require("mysql2/promise");
const mongoose = require("mongoose");
const User = require("./models/User");

const migrateUsers = async() => {
    let mysqlConnection;

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB Connected");

        // Create a fresh MySQL connection
        mysqlConnection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log("MySQL Connected");

        // Read users from MySQL
        const [users] = await mysqlConnection.execute(
            "SELECT * FROM users"
        );

        console.log(`Found ${users.length} users in MySQL`);

        // Copy users to MongoDB
        for (const user of users) {

            await User.updateOne({ email: user.email }, {
                $set: {
                    name: user.name,
                    email: user.email,
                    password: user.password,
                    created_at: user.created_at,
                    role: user.role || "customer",
                    employee_code: user.employee_code,
                    phone: user.phone
                }
            }, { upsert: true });

        }

        console.log("Users migration completed successfully!");

    } catch (error) {

        console.error("Migration failed:", error);

    } finally {

        if (mysqlConnection) {
            await mysqlConnection.end();
        }

        await mongoose.connection.close();

    }
};

migrateUsers();