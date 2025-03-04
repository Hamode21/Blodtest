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
