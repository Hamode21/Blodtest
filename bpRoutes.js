const express = require('express');
const router = express.Router();

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
module.exports = (db) => { // מקבל את ה-db כפרמטר
    router.post('/bp/:userId', validateMeasurement, (req, res) => {
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

try {
    const pool = await sql.connect();
    const result = await pool.request()
        .input('userId', sql.NVarChar, userId)
        .query('SELECT * FROM measurements WHERE userId = @userId');
    if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'אין נתונים למשתמש הזה' });
    }
    res.json({
        userId: userId,
        measurements: result.recordset
    });
} catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בקריאה' });
}
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

        let query = `SELECT * FROM measurements WHERE userId = ?`;
        let params = [userId];

        if (startDate && endDate) {
            query += ` AND date >= ? AND date <= ?`;
            params.push(startDate, endDate);
        }

try {
    const pool = await sql.connect();
    const result = await pool.request()
        .input('userId', sql.NVarChar, userId)
        .input('startDate', sql.DateTime, startDate || null)
        .input('endDate', sql.DateTime, endDate || null)
        .query(query);
    if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'אין נתונים למשתמש הזה' });
    }
    const measurements = result.recordset;
    // חישוב ממוצעים והדגשות...
} catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בקריאה' });
}
            const totalSys = rows.reduce((sum, m) => sum + m.systolic, 0);
            const totalDia = rows.reduce((sum, m) => sum + m.diastolic, 0);
            const avgSys = totalSys / rows.length;
            const avgDia = totalDia / rows.length;

            const highlightedMeasurements = rows.map(m => {
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
        const start = new Date(year, monthNum - 1, 1).toISOString().split('T')[0];
        const end = new Date(year, monthNum, 0).toISOString().split('T')[0];

       
    return router;
};
try {
    const pool = await sql.connect();
    const usersResult = await pool.request().query('SELECT DISTINCT userId FROM measurements');
    const users = usersResult.recordset;

    const summaryPromises = users.map(async (user) => {
        const result = await pool.request()
            .input('userId', sql.NVarChar, user.userId)
            .input('start', sql.DateTime, start)
            .input('end', sql.DateTime, end)
            .query('SELECT * FROM measurements WHERE userId = @userId AND date >= @start AND date <= @end');
        const measurements = result.recordset;
        // חישוב ממוצעים וחריגות...
    });

    const summary = await Promise.all(summaryPromises);
    res.json({ month, summary });
} catch (err) { ... }
