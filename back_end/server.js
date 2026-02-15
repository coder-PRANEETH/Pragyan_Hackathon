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

// Create model
const User = mongoose.model('User', userSchema);

// -------------------- GET: Fetch user by userId --------------------
app.get('/user-details/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
});

// -------------------- POST: Create new user --------------------
app.post('/create-user', async (req, res) => {
  try {
    const { name, age, gender, medical, symptoms, risk } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Create new user
    const newUser = new User({
      name,
      age,
      gender,
      medical: medical || [],
      symptoms: symptoms || [],
      risk
    });

    // Save to database
    const savedUser = await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: savedUser
    });

  } catch (error) {
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
});

// -------------------- POST: Analyze symptoms using ML model --------------------
app.post('/analyze-symptoms', async (req, res) => {
  try {
    const { user_data, symptoms } = req.body;

    // Validate required fields
    if (!user_data || !symptoms || symptoms.length === 0) {
      return res.status(400).json({
        message: "user_data and symptoms are required"
      });
    }

    // Call FastAPI prediction endpoint
    const response = await axios.post('http://localhost:8000/predict', {
      user_data,
      symptoms
    }, {
      timeout: 30000  // 30 second timeout
    });

    res.json({
      message: "Analysis completed successfully",
      results: response.data
    });

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: "ML service is unavailable. Please ensure the FastAPI server is running on port 8000.",
        error: "Connection refused"
      });
    }

    res.status(500).json({
      message: "Error analyzing symptoms",
      error: error.response?.data || error.message
    });
  }
});

// -------------------- POST endpoint --------------------
app.post('/query', (req, res) => {
  const query = req.body;
  res.json({ message: 'Query received', query });
});

// -------------------- Connect DB Once --------------------
async function connectDB() {
  try {
    await mongoose.connect(uri, clientOptions);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("Error connecting to MongoDB:", err);
  }
}

connectDB();

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
