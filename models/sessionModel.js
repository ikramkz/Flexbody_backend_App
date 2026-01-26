// const mongoose = require('mongoose');

// const SessionSchema = new mongoose.Schema({
//   patient_first_name: String,
//   patient_last_name: String,
//   patient_mobile_no: { type: String, unique: true },
//   score: Number,
//   duration: Number,
//   exercise_type: String,
//   initial_rom: Number,
//   current_rom: Number,
//   progress: Number, // calculated
//   updatedAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Session', SessionSchema);



const mongoose = require("mongoose");

const ExerciseSchema = new mongoose.Schema({
  exercise_type: String,
  scoreLeft: { type: Number, default: null },
  scoreRight: { type: Number, default: null },
  last_scoreLeft: { type: Number, default: null },
  last_scoreRight: { type: Number, default: null },
  current_total_score: { type: Number, default: null },
  current_total_score_date: { type: Date, default: null },
  last_total_score: { type: Number, default: null },
  last_total_score_date: { type: Date, default: null },
  third_total_score: { type: Number, default: null },
  third_total_score_date: { type: Date, default: null },
  forth_total_score: { type: Number, default: null },
  forth_total_score_date: { type: Date, default: null },
  fifth_total_score: { type: Number, default: null },
  fifth_total_score_date: { type: Date, default: null },
  duration: String,
  initial_romLeft: { type: Number, default: null },
  current_romLeft: { type: Number, default: null },
  current_romLeft_date: { type: Date, default: null },
  initial_romRight: { type: Number, default: null },
  current_romRight: { type: Number, default: null },
  current_romRight_date: { type: Date, default: null },
  last_romLeft: { type: Number, default: null },
  last_romRight: { type: Number, default: null },
  // History fields for tracking last 5 ROM records
  left_rom2: { type: Number, default: null },
  left_rom3: { type: Number, default: null },
  left_rom4: { type: Number, default: null },
  left_rom5: { type: Number, default: null },
  right_rom2: { type: Number, default: null },
  right_rom3: { type: Number, default: null },
  right_rom4: { type: Number, default: null },
  right_rom5: { type: Number, default: null },
  // Date/time fields for ROM history (only set when value is not null)
  left_rom2_date: { type: Date, default: null },
  left_rom3_date: { type: Date, default: null },
  left_rom4_date: { type: Date, default: null },
  left_rom5_date: { type: Date, default: null },
  right_rom2_date: { type: Date, default: null },
  right_rom3_date: { type: Date, default: null },
  right_rom4_date: { type: Date, default: null },
  right_rom5_date: { type: Date, default: null },
  progressLeft: { type: Number, default: null },
  progressRight: { type: Number, default: null }
});

const SessionSchema = new mongoose.Schema({
  patient_first_name: String,
  patient_last_name: String,
  patient_mobile_no: { type: String, unique: true },
  patient_DOB: { type: String, default: "" },
  patient_goals: { type: String, default: "" },
  patient_injuries: { type: String, default: "" },
  patient_area_focus: { type: String, default: "" },

  exercise_history: [ExerciseSchema], // ← ARRAY OF EXERCISES

  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Session", SessionSchema);
