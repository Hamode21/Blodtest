const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const bpRoutes = require('./routes/bpRoutes');
const sqlite3 = require('sqlite3').verbose(); // חדש - SQLite

const app = express();
const port = 3000;

// חיבור ל-SQLite
const db = new sqlite3.Database('bp_database.db', (err) => {
    if (err) {
        console.error('שגיאה בחיבור לבסיס נתונים:', err.message);
    } else {
        console.log('מחובר לבסיס נתונים SQLite');
        // יצירת טבלה אם היא לא קיימת
        db.run(`
            CREATE TABLE IF NOT EXISTS measurements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT NOT NULL,
                systolic INTEGER NOT NULL,
                diastolic INTEGER NOT NULL,
                pulse INTEGER,
                date TEXT NOT NULL
            )
        `);
    }
});

// Middleware בסיסי
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware לבדיקת תקינות בסיסית
const checkRequest = (req, res, next) => {
    console.log(`בקשה נכנסת: ${req.method} ${req.path}`);
    next();
};
app.use(checkRequest);

// הגדרת Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Blood Pressure API',
            version: '1.0.0',
            description: 'API לניהול מדידות לחץ דם',
        },
        servers: [{ url: `http://localhost:${port}` }],
    },
    apis: ['./routes/bpRoutes.js'],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use('/api', bpRoutes(db)); // מעביר את ה-db ל-routes

app.listen(port, () => {
    console.log(`השרת עובד ב-http://localhost:${port}`);
});
