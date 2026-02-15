require('dns').setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { userSchema } = require('./schema.js');

const uri = "mongodb+srv://surya:surya@cluster0.xyxikjy.mongodb.net/?appName=Cluster0";

const clientOptions = {
  serverApi: { version: '1', strict: true, deprecationErrors: true }
};

const app = express();
app.use(cors());
app.use(express.json());

const User = mongoose.model('User', userSchema);

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
