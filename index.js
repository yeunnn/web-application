const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();
const port = 3000;

// Setting the view engine to ejs
app.set('view engine', 'ejs');

// Middleware to parse the body of HTTP requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files directory setup
app.use(express.static('public'));

// MySQL database connection setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',  // your database user
    password: 'mysql1315',  // your database password
    database: 'distributed_db'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to the database');
});

// Route to render the Home Page (Add Appointment Form)
app.get('/', (req, res) => {
    res.render('index');
});

// Route to handle the creation of an appointment
app.post('/appointments', (req, res) => {
    const { patient_name, date_of_appointment, hospital, doctor, region } = req.body;
    const insertQuery = 'INSERT INTO appointments (patient_name, date_of_appointment, hospital, doctor, region) VALUES (?, ?, ?, ?, ?)';
    
    db.query(insertQuery, [patient_name, date_of_appointment, hospital, doctor, region], (err) => {
        if (err) throw err;
        res.redirect('/appointments');
    });
});

// Route to display all appointments
app.get('/appointments', (req, res) => {
    const query = 'SELECT * FROM appointments ORDER BY date_of_appointment DESC';
    db.query(query, (err, results) => {
        if (err) throw err;
        res.render('appointments', { appointments: results });
    });
});

// Fetch an appointment to edit
app.get('/appointments/edit/:id', (req, res) => {
    const findQuery = 'SELECT * FROM appointments WHERE id = ?';
    db.query(findQuery, [req.params.id], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            res.status(500).send("Error fetching appointment");
            return;
        }
        if (results.length > 0) {
            res.render('edit_appointment', { appointment: results[0] });
        } else {
            res.status(404).send("Appointment not found");
        }
    });
});

app.post('/appointments/edit/:id', (req, res) => {
    const { patient_name, date_of_appointment, hospital, doctor, region } = req.body;
    const updateQuery = 'UPDATE appointments SET patient_name = ?, date_of_appointment = ?, hospital = ?, doctor = ?, region = ? WHERE id = ?';
    
    db.query(updateQuery, [patient_name, date_of_appointment, hospital, doctor, region, req.params.id], (err) => {
        if (err) throw err;
        res.redirect('/appointments');
    });
});

// Route to delete an appointment
app.get('/appointments/delete/:id', (req, res) => {
    const deleteQuery = 'DELETE FROM appointments WHERE id = ?';
    db.query(deleteQuery, [req.params.id], (err) => {
        if (err) throw err;
        res.redirect('/appointments');
    });
});

// Search for appointments
app.get('/appointments/search', (req, res) => {
    if (!req.query.search) {
        return res.redirect('/appointments'); // Redirect to all appointments if search is empty
    }
    const searchQuery = 'SELECT * FROM appointments WHERE patient_name LIKE ? OR hospital LIKE ? OR doctor LIKE ?';
    let searchTerm = `%${req.query.search}%`;
    db.query(searchQuery, [searchTerm, searchTerm, searchTerm], (err, results) => {
        if (err) throw err;
        res.render('appointments', { appointments: results });
    });
});

// Report: Appointments per Hospital
app.get('/reports/hospitals', (req, res) => {
    const reportQuery = 'SELECT hospital, COUNT(*) as number_of_appointments FROM appointments GROUP BY hospital';
    db.query(reportQuery, (err, results) => {
        if (err) throw err;
        res.render('report', { title: 'Appointments per Hospital', data: results });
    });
});

// Report: Appointments per Doctor
app.get('/reports/doctors', (req, res) => {
    const reportQuery = 'SELECT doctor, COUNT(*) as number_of_appointments FROM appointments GROUP BY doctor';
    db.query(reportQuery, (err, results) => {
        if (err) throw err;
        res.render('report', { title: 'Appointments per Doctor', data: results });
    });
});

// Server listening on port 3000
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});