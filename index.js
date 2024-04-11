const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();
const port = 3000;
const { v4: uuidv4 } = require('uuid');

// Setting the view engine to ejs
app.set('view engine', 'ejs');

// Middleware to parse the body of HTTP requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files directory setup
app.use(express.static('public'));

// MySQL database connection setup
const db = mysql.createConnection({
    host: 'ccscloud.dlsu.edu.ph',
    user: 'root1',  // Replace with your actual database user
    password: '1234',  // Replace with your actual database password
    database: 'distributed_db',
    port: 20034
});

db.connect(err => {
    if (err) {
        console.error('Failed to connect to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

// Route to render the Home Page (Add Appointment Form)
app.get('/', (req, res) => {
    res.render('index');
});

// Route to handle the creation of an appointment
app.post('/appointments', (req, res) => {
    const apptid = uuidv4(); // Generates a unique UUID
    const { date_of_appointment, patient_gender, patient_age, hospital_name, doctor_specialty, doctor_age, region } = req.body;

    const insertQuery = `
        INSERT INTO appointments 
        (apptid, date_of_appointment, patient_gender, patient_age, hospital_name, doctor_specialty, doctor_age, region) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(insertQuery, [apptid, date_of_appointment, patient_gender, patient_age, hospital_name, doctor_specialty, doctor_age, region], (err) => {
        if (err) {
            console.error("Insert error:", err);
            return res.status(500).send("Error adding appointment");
        }
        res.redirect('/appointments');
    });
});

// Route to display all appointments
app.get('/appointments', (req, res) => {
    const query = 'SELECT * FROM appointments ORDER BY date_of_appointment DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error("Select error:", err);
            res.status(500).send("Error fetching appointments");
            return;
        }
        res.render('appointments', { appointments: results });
    });
});

// Fetch an appointment to edit
app.get('/appointments/edit/:apptid', (req, res) => {
    const findQuery = 'SELECT * FROM appointments WHERE apptid = ?';
    db.query(findQuery, [req.params.apptid], (err, results) => {
        if (err) {
            console.error("Find error:", err);
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

app.post('/appointments/edit/:apptid', (req, res) => {
    const { date_of_appointment, patient_gender, patient_age, hospital_name, doctor_specialty, doctor_age, region } = req.body;
    const updateQuery = `
        UPDATE appointments 
        SET date_of_appointment = ?, patient_gender = ?, patient_age = ?, hospital_name = ?, doctor_specialty = ?, doctor_age = ?, region = ? 
        WHERE apptid = ?`;
    
    db.query(updateQuery, [date_of_appointment, patient_gender, patient_age, hospital_name, doctor_specialty, doctor_age, region, req.params.apptid], (err, results) => {
        if (err) {
            console.error("Update error:", err);
            res.status(500).send("Error updating appointment");
            return;
        }
        res.redirect('/appointments');
    });
});

// Route to delete an appointment
app.get('/appointments/delete/:apptid', (req, res) => {
    const deleteQuery = 'DELETE FROM appointments WHERE apptid = ?';
    db.query(deleteQuery, [req.params.apptid], (err, results) => {
        if (err) {
            console.error("Delete error:", err);
            res.status(500).send("Error deleting appointment");
            return;
        }
        res.redirect('/appointments');
    });
});

// Search for appointments
app.get('/appointments/search', (req, res) => {
    if (!req.query.search) {
        return res.redirect('/appointments'); // Redirect to all appointments if search is empty
    }
    const searchQuery = 'SELECT * FROM appointments WHERE patient_gender LIKE ? OR hospital_name LIKE ? OR doctor_specialty LIKE ?';
    let searchTerm = `%${req.query.search}%`;
    db.query(searchQuery, [searchTerm, searchTerm, searchTerm], (err, results) => {
        if (err) {
            console.error("Search error:", err);
            res.status(500).send("Error searching appointments");
            return;
        }
        res.render('appointments', { appointments: results });
    });
});

// Report: Appointments per Hospital
app.get('/reports/hospitals', (req, res) => {
    const reportQuery = 'SELECT hospital_name, COUNT(*) as number_of_appointments FROM appointments GROUP BY hospital_name';
    db.query(reportQuery, (err, results) => {
        if (err) throw err;
        res.render('report', { title: 'Appointments per Hospital', data: results });
    });
});

// Report: Appointments per Doctor
app.get('/reports/doctors', (req, res) => {
    const reportQuery = 'SELECT doctor_specialty, COUNT(*) as number_of_appointments FROM appointments GROUP BY doctor_specialty';
    db.query(reportQuery, (err, results) => {
        if (err) throw err;
        res.render('report', { title: 'Appointments per Doctor Specialty', data: results });
    });
});

// Server listening on port 3000
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});