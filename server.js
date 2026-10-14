

const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// MySQL database connection
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "mahepvni@2006",
    database: "patient_db",
    waitForConnections: true,
    connectionLimit: 10
});

// Test database connection and start server
async function startServer() {
    try {
        const connection = await db.getConnection();
        console.log("MySQL database connected successfully!");
        connection.release();

        app.listen(PORT, () => {
            console.log(`Website running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MySQL connection failed:", error.message);
    }
}

// 1. Get all patient records
app.get("/api/patients", async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT
                patient_id,
                patient_name,
                age,
                gender,
                phone,
                email,
                address
            FROM patient
            ORDER BY patient_id ASC
        `);

        res.status(200).json(rows);

    } catch (error) {
        console.error("Error fetching patients:", error.message);

        res.status(500).json({
            error: "Unable to fetch patient records",
            details: error.message
        });
    }
});

// 2. Add a new patient
app.post("/api/patients", async (req, res) => {
    try {
        const {
            patient_name,
            age,
            gender,
            phone,
            email,
            address
        } = req.body;

        if (!patient_name || !patient_name.trim()) {
            return res.status(400).json({
                error: "Patient name is required"
            });
        }

        const patientAge =
            age === "" || age == null ? null : Number(age);

        if (
            patientAge !== null &&
            (!Number.isInteger(patientAge) ||
             patientAge < 0 ||
             patientAge > 130)
        ) {
            return res.status(400).json({
                error: "Enter a valid age"
            });
        }

        const [result] = await db.execute(
            `INSERT INTO patient
            (patient_name, age, gender, phone, email, address)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                patient_name.trim(),
                patientAge,
                gender || null,
                phone || null,
                email || null,
                address || null
            ]
        );

        res.status(201).json({
            message: "Patient added successfully",
            patient_id: result.insertId
        });

    } catch (error) {
        console.error("Error adding patient:", error.message);

        res.status(500).json({
            error: "Unable to save patient",
            details: error.message
        });
    }
});

// 3. Delete a patient
app.delete("/api/patients/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                error: "Invalid patient ID"
            });
        }

        const [result] = await db.execute(
            "DELETE FROM patient WHERE patient_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Patient not found"
            });
        }

        res.json({
            message: "Patient deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting patient:", error.message);

        res.status(500).json({
            error: "Unable to delete patient",
            details: error.message
        });
    }
});

// 4. Start server
startServer();