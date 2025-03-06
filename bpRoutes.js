const express = require('express');
const router = express.Router();
const sql = require('mssql'); // ייבוא של mssql

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

    req.validatedData = { sys, dia, pul };
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
module.exports = (sql) => { // שינוי מ-db ל-sql
    router.post('/bp/:userId', validateMeasurement, async (req, res) => { // הוספת async
        const userId = req.params.userId;
        const { sys, dia, pul } = req.validatedData;
        const { date } = req.body;

        const newMeasurement = {
            userId,
            systolic: sys,
            diastolic: dia,
            pulse: pul,
            date: date || new Date().toISOString(),
        };

        try {
            const pool = await sql.connect();
            await pool.request()
                .input('userId', sql.NVarChar, userId)
                .input('systolic', sql.Int, sys)
                .input('diastolic', sql.Int, dia)
                .input('pulse', sql.Int, pul)
                .input('date', sql.DateTime, newMeasurement.date)
                .query('INSERT INTO measurements (userId, systolic, diastolic, pulse, date) VALUES (@userId, @systolic, @diastolic, @pulse, @date)');
            res.status(201).json({
                message: 'המדידה נשמרה',
                measurement: newMeasurement
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'שגיאה בשמירה' });
        }
