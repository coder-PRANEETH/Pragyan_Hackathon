require('dns').setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { userSchema, doctorSchema } = require('./schema.js');

const uri = "mongodb+srv://surya:surya@cluster0.xyxikjy.mongodb.net/?appName=Cluster0";

const clientOptions = {
  serverApi: { version: '1', strict: true, deprecationErrors: true }
};

const app = express();
app.use(cors());
app.use(express.json());

const User = mongoose.model('User', userSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);

//////////////////////////////////////////////////////////////
// GET USER
//////////////////////////////////////////////////////////////
app.get('/user-details/:name', async (req, res) => {
  try {
    const user = await User.findOne({ name: req.params.name });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
});

//////////////////////////////////////////////////////////////
// CREATE USER
//////////////////////////////////////////////////////////////
app.post('/create-user', async (req, res) => {
  try {
    const { name, age, gender, medical } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const newUser = new User({
      name,
      age,
      gender,
      medical: medical || [],
      symptoms: [],
      risk: "none",
      department: null
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: savedUser
    });

  } catch (error) {
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
});

//////////////////////////////////////////////////////////////
// ANALYZE SYMPTOMS (CALL FASTAPI ML)
//////////////////////////////////////////////////////////////
app.post('/analyze-symptoms', async (req, res) => {
  try {
    const { userName, symptoms, medicalData } = req.body;

    if (!userName || !symptoms || !medicalData) {
      return res.status(400).json({
        message: "userName, symptoms, and medicalData are required"
      });
    }

    const user = await User.findOne({ name: userName });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    ////////////////////////////////////////////////////////
    // CALL FASTAPI /predict (Correct Payload Format)
    ////////////////////////////////////////////////////////
    const mlResponse = await axios.post(
      'http://localhost:8000/predict',
      {
        user_data: {
          Age: medicalData.age || 30,
          Gender: medicalData.gender || "Male",
          Blood_Pressure: medicalData.bp_systolic || 120,
          Heart_Rate: medicalData.heart_beat || 72,
          Temperature: medicalData.temperature || 98.6,
          Pre_Existing_Conditions: "None"
        },
        symptoms: [symptoms]
      },
      { timeout: 30000 }
    );

    const mlData = mlResponse.data;

    ////////////////////////////////////////////////////////
    // SAVE RESULTS
    ////////////////////////////////////////////////////////
    user.risk = mlData.risk;
    user.department = mlData.department;

    user.symptoms.push({
      description: symptoms,
      assessedAt: new Date(),
      riskLevel: mlData.risk,
      department: mlData.department
    });

    await user.save();

    ////////////////////////////////////////////////////////
    // ASSIGN PATIENT TO DOCTOR (SORTED BY RISK PRIORITY)
    ////////////////////////////////////////////////////////
    if (mlData.department) {
      // Find a doctor with the matching department
      const doctor = await Doctor.findOne({ department: mlData.department }).populate('patients');

      if (doctor) {
        // Check if patient is not already assigned to this doctor
        const isAlreadyAssigned = doctor.patients.some(p => p._id.toString() === user._id.toString());

        if (!isAlreadyAssigned) {
          // Define risk priority (higher number = higher priority)
          const riskPriority = {
            "High Risk": 3,
            "Medium Risk": 2,
            "Low Risk": 1,
            "none": 0
          };

          // Add the new patient
          doctor.patients.push(user);

          // Sort patients by risk priority (high to low)
          doctor.patients.sort((a, b) => {
            const priorityA = riskPriority[a.risk] || 0;
            const priorityB = riskPriority[b.risk] || 0;
            return priorityB - priorityA;
          });

          // Extract just the IDs for storage
          doctor.patients = doctor.patients.map(p => p._id);

          await doctor.save();
          console.log(`Patient ${user.name} (${user.risk}) assigned to Dr. ${doctor.name} (${doctor.department})`);
        }
      } else {
        console.log(`No doctor found for department: ${mlData.department}`);
      }
    }

    ////////////////////////////////////////////////////////
    // RETURN RESPONSE
    ////////////////////////////////////////////////////////
    console.log({
      message: "Analysis completed successfully",
      risk: mlData.risk,
      department: mlData.department,
      risk_explanation: mlData.risk_explanation,
      department_explanation: mlData.department_explanation
    });
    res.json({
      message: "Analysis completed successfully",
      risk: mlData.risk,
      department: mlData.department,
      risk_explanation: mlData.risk_explanation,
      department_explanation: mlData.department_explanation
    });

  } catch (error) {

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: "ML service unavailable. Ensure FastAPI runs on port 8000."
      });
    }

    console.error("Analyze symptoms error:", error.response?.data || error.message);

    res.status(500).json({
      message: "Error analyzing symptoms",
      error: error.response?.data || error.message
    });
  }
});

//////////////////////////////////////////////////////////////
// CONNECT DB
//////////////////////////////////////////////////////////////
async function connectDB() {
  try {
    await mongoose.connect(uri, clientOptions);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("Error connecting to MongoDB:", err);
  }
}

connectDB();

//////////////////////////////////////////////////////////////
// START SERVER
//////////////////////////////////////////////////////////////
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
