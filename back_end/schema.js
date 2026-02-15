const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema({
  description: String,
  assessedAt: Date,
  riskLevel: String,
  department: String
}, { _id: false });

const medicalSchema = new mongoose.Schema({
  heart_beat: Number,
  temperature: Number,
  blood_group: String,
  bp_systolic: Number,
  bp_diastolic: Number,
  oxygen_level: Number,
  bmi: Number
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: Number,
  gender: String,
  medical: [medicalSchema],
  symptoms: [symptomSchema],   // ✅ FIXED
  risk: String,
  department: String
}, { timestamps: true });

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = { userSchema, doctorSchema };
