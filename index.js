const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const bpRoutes = require('./routes/bpRoutes');
const sqlite3 = require('sqlite3').verbose(); // חדש - SQLite

const app = express();
const port = 3000;

// הגדרת חיבור ל-SQL Server
const dbConfig = {
    user: 'sa', // שנה לשם המשתמש שלך 
    password: 'your_password', // שנה לסיסמה שלך
    server: 'localhost', 
    database: 'BloodPressureDB', 
    options: {
        encrypt: false, 
        trustServerCertificate: true 
    }
};

// חיבור ל-SQL Server
sql.connect(dbConfig).then(pool => {
    console.log('מחובר ל-SQL Server');
   
}).catch(err => {
    console.error('שגיאה בחיבור לבסיס נתונים:', err);
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
