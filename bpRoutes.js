const express = require('express');
const router = express.Router();

// מקום לשמירת הנתונים (בזיכרון לעת עתה)
const bloodPressureData = {};

// Middleware לבדיקת נתוני מדידה
const validateMeasurement = (req, res, next) => {
    const { systolic, diastolic, pulse } = req.body;
    const sys = Number(systolic);
    const dia = Number(diastolic);
    const pul = pulse ? Number(pulse) : null;

    if (!systolic || !diastolic) {
        return res.status(400).json({ error: 'חייב לשלוח ערך גבוה ונמוך' });
    }
    if (isNaN(sys) || isNaN(dia) || (pul !== null && isNaN(pul))) {
        return res.status(400).json({ error: 'הערכים חייבים להיות מספרים' });
    }
    if (sys < 50 || sys > 250 || dia < 30 || dia > 150) {
        return res.status(400).json({ error: 'הערכים לא הגיוניים' });
    }

    req.validatedData = { sys, dia, pul }; // שומר את הנתונים המאומתים
    next();
};

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
router.post('/bp/:userId', validateMeasurement, (req, res) => {
    const userId = req.params.userId;
    const { sys, dia, pul } = req.validatedData;
    const { date } = req.body;

    if (!bloodPressureData[userId]) {
        bloodPressureData[userId] = [];
    }

    const newMeasurement = {
        systolic: sys,
        diastolic: dia,
        pulse: pul,
        date: date || new Date().toISOString(),
    };

    bloodPressureData[userId].push(newMeasurement);

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
router.get('/bp/:userId', (req, res) => {
    const userId = req.params.userId;

    if (!bloodPressureData[userId]) {
        res.status(404).json({ error: 'אין נתונים למשתמש הזה' });
        return;
    }

    res.json({
        userId: userId,
        measurements: bloodPressureData[userId]
    });
});

/**
 * @swagger
 * /history/{userId}:
 *   get:
 *     summary: קבלת היסטוריית מדידות עם הדגשות
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: היסטוריה עם ממוצעים והדגשות
 *       404:
 *         description: אין נתונים
 */
router.get('/history/:userId', (req, res) => {
    const userId = req.params.userId;
    const { startDate, endDate } = req.query;

    if (!bloodPressureData[userId]) {
        res.status(404).json({ error: 'אין נתונים למשתמש הזה' });
        return;
    }

    let measurements = bloodPressureData[userId];

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        measurements = measurements.filter(m => {
            const measurementDate = new Date(m.date);
            return measurementDate >= start && measurementDate <= end;
        });
    }

    const totalSys = measurements.reduce((sum, m) => sum + m.systolic, 0);
    const totalDia = measurements.reduce((sum, m) => sum + m.diastolic, 0);
    const avgSys = totalSys / measurements.length;
    const avgDia = totalDia / measurements.length;

    const highlightedMeasurements = measurements.map(m => {
        const isSysHighlighted = Math.abs(m.systolic - avgSys) > avgSys * 0.2;
        const isDiaHighlighted = Math.abs(m.diastolic - avgDia) > avgDia * 0.2;
        return {
            ...m,
            highlight: isSysHighlighted || isDiaHighlighted
        };
    });

    res.json({
        userId: userId,
        averageSystolic: avgSys,
        averageDiastolic: avgDia,
        measurements: highlightedMeasurements
    });
});

/**
 * @swagger
 * /users-summary:
 *   get:
 *     summary: סיכום מדידות לכל המשתמשים בחודש נתון
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: 2023-11
 *     responses:
 *       200:
 *         description: סיכום לכל המשתמשים
 *       400:
 *         description: חסר חודש
 */
router.get('/users-summary', (req, res) => {
    const { month } = req.query;

    if (!month) {
        res.status(400).json({ error: 'חייב לשלוח חודש' });
        return;
    }

    const [year, monthNum] = month.split('-');
    const start = new Date(year, monthNum - 1, 1);
    const end = new Date(year, monthNum, 0);

    const summary = Object.keys(bloodPressureData).map(userId => {
        const measurements = bloodPressureData[userId].filter(m => {
            const date = new Date(m.date);
            return date >= start && date <= end;
        });

        if (measurements.length === 0) {
            return { userId, averageSystolic: 0, averageDiastolic: 0, outliers: 0 };
        }

        const totalSys = measurements.reduce((sum, m) => sum + m.systolic, 0);
        const totalDia = measurements.reduce((sum, m) => sum + m.diastolic, 0);
        const avgSys = totalSys / measurements.length;
        const avgDia = totalDia / measurements.length;

        const outliers = measurements.filter(m =>
            Math.abs(m.systolic - avgSys) > avgSys * 0.2 ||
            Math.abs(m.diastolic - avgDia) > avgDia * 0.2
        ).length;

        return {
            userId,
            averageSystolic: avgSys,
            averageDiastolic: avgDia,
            outliers
        };
    });

    res.json({ month, summary });
});

module.exports = router;
