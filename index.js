const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express'); 
const swaggerJsdoc = require('swagger-jsdoc');
const app = express();
const port = 3000;

// הגדרת שרת
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

//מקום לשמור את הנתונים
const bloodPressureData = {};

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
    apis: ['index.js'], // הקובץ שבו נשים את התיעוד
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * @swagger
 * /bp/{userId}:
 *   post:
 *     summary: הוספת מדידת לחץ דם חדשה
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               systolic:
 *                 type: number
 *               diastolic:
 *                 type: number
 *               pulse:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: המדידה נשמרה
 *       400:
 *         description: שגיאה בנתונים
 */

//שמירת מדידה חדשה
app.post('/bp/:userId', (req, res) => {
    // כשמישהו שולח נתונים לכתובת כמו /bp/user1 עם POST
    const userId = req.params.userId; // לוקח את שם המשתמש מהכתובת (למשל: user1)
    const { systolic, diastolic, pulse, date } = req.body; 

    // בודק אם חסר ערך גבוה או נמוך
    if (!systolic || !diastolic) {
        res.status(400).json({ error: 'חייב לשלוח ערך גבוה ונמוך' }); // שולח שגיאה אם חסר
        return; 
    } 

    // הופך את הערכים למספרים
    const sys = Number(systolic); // ערך גבוה
    const dia = Number(diastolic); // ערך נמוך
    const pul = pulse ? Number(pulse) : null; // דופק (אם אין, שם null)

    // בודק תקינות הערכים
    if (isNaN(sys) || isNaN(dia) || (pul !== null && isNaN(pul))) {
        res.status(400).json({ error: 'הערכים חייבים להיות מספרים' }); 
        return; 
    } 

    // בודק אם הערכים הגיוניים
    if (sys < 50 || sys > 250 || dia < 30 || dia > 150) {
        res.status(400).json({ error: 'הערכים לא הגיוניים' }); 
        return; 
    }

    // בודק אם למשתמש אין עדיין נתונים
    if (!bloodPressureData[userId]) {
        bloodPressureData[userId] = []; // יוצר רשימה ריקה למשתמש
    }

    // יוצר אובייקט עם המדידה החדשה
    const newMeasurement = {
        systolic: sys, // ערך גבוה
        diastolic: dia, // ערך נמוך
        pulse: pul, // דופק
        date: date || new Date().toISOString(), // תאריך
    };

    // שומר את המדידה ברשימה של המשתמש
    bloodPressureData[userId].push(newMeasurement);

    // שולח תגובה שהכל בסדר
    res.status(201).json({
        message: 'המדידה נשמרה',
        measurement: newMeasurement
    });
});
/**
 * @swagger
 * /bp/{userId}:
 *   get:
 *     summary: קבלת כל המדידות של משתמש
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: רשימת המדידות
 *       404:
 *         description: אין נתונים
 */

// הצגת היסטוריה עם תאריכים והדגשות
app.get('/history/:userId', (req, res) => {
    const userId = req.params.userId;
    const { startDate, endDate } = req.query; 

    if (!bloodPressureData[userId]) {
        res.status(404).json({ error: 'אין נתונים למשתמש הזה' });
        return;
    }
// לוקח את כל המדידות של המשתמש
    let measurements = bloodPressureData[userId];

// מסנן לפי תאריכים אם נתנו אותם
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        measurements = measurements.filter(m => {
            const measurementDate = new Date(m.date);
            return measurementDate >= start && measurementDate <= end;
        });
    }
// חישוב ממוצע של ערך גבוה וערך נמוך
    const totalSys = measurements.reduce((sum, m) => sum + m.systolic, 0);
    const totalDia = measurements.reduce((sum, m) => sum + m.diastolic, 0);
    const avgSys = totalSys / measurements.length;
    const avgDia = totalDia / measurements.length;
// מוסיף סימון למדידות שחרגו ב-20% מהממוצע
    const highlightedMeasurements = measurements.map(m => {
        const isSysHighlighted = Math.abs(m.systolic - avgSys) > avgSys * 0.2; // חורג ב-20% מהממוצע של הגבוה
        const isDiaHighlighted = Math.abs(m.diastolic - avgDia) > avgDia * 0.2; // חורג ב-20% מהממוצע של הנמוך
        return {
            ...m,
            highlight: isSysHighlighted || isDiaHighlighted // מסמן אם צריך הדגשה
        };
    });

    res.json({
        userId: userId,
        averageSystolic: avgSys,
        averageDiastolic: avgDia,
        measurements: highlightedMeasurements
    });
});

app.listen(port, () => {
    console.log(`השרת עובד ב-http://localhost:${port}`);
});
