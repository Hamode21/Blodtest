const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const bpRoutes = require('./routes/bpRoutes'); // מביא את ה-routes מקובץ נפרד

const app = express();
const port = 3000;

// Middleware בסיסי
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public'))); 

// Middleware לבדיקת תקינות בסיסית
const checkRequest = (req, res, next) => {
    console.log(`בקשה נכנסת: ${req.method} ${req.path}`);
    next(); // ממשיך לטפל בבקשה
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
    apis: ['./routes/bpRoutes.js'], // התיעוד נמצא בקובץ ה-routes
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// כל המסלולים של ה-API תחת /api
app.use('/api', bpRoutes);

// הפעלת השרת
app.listen(port, () => {
    console.log(`השרת עובד ב-http://localhost:${port}`);
});
