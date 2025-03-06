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

