//server.js
const express = require('express');
const cors = require('cors');
const app = express();
const HospitalRoutes = require('./app/routes/HospitalRoutes/hospital.routes');
const HospitalStaffRoutes = require('./app/routes/HospitalStaffRoutes/hospitalStaff.routes')

const allowedOrigins = ['*'];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200,
};


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));


app.use('/api/mic/hospital', HospitalRoutes);
app.use('/api/mic/hospitalStaff', HospitalStaffRoutes);


app.listen(8080, '0.0.0.0', () => {
    console.log('Server is running on port 8080.');
});
