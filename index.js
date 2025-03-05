const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// הגדרת שרת
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

//מקום לשמור את הנתונים
const bloodPressureData = {};

//כניסה לדף
app.get('/', (req, res) => {
    // כניסה ל לוקאל הוסט
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    return; 
}); 

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
