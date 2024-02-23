require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const HospitalRoutes = require('./app/routes/HospitalRoutes/hospital.routes');
const HospitalStaffRoutes = require('./app/routes/HospitalStaffRoutes/hospitalStaff.routes');
const InsuranceProviderRoutes = require('./app/routes/InsuranceProviderRoutes/insuranceProvider.routes');
const PatientRoutes = require('./app/routes/PatientRoutes/patient.routes');

const corsOptions = {
  origin: '*', 
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/mic/hospital', HospitalRoutes);
app.use('/api/mic/hospitalStaff', HospitalStaffRoutes);
app.use('/api/mic/insuranceProvider', InsuranceProviderRoutes);
app.use('/api/mic/patient',PatientRoutes);

app.listen(1313, '0.0.0.0', () => {
  console.log("\x1b[31mOk\x1b[0m \x1b[32mlet's\x1b[0m \x1b[33mgo\x1b[0m \x1b[34mto\x1b[0m \x1b[35mPostman\x1b[0m \x1b[36m(1313)\x1b[0m");   
});
