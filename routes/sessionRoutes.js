const express = require("express");
const router = express.Router();
const Session = require("../models/sessionModel");

// ------------------------------
// API 1: Save or Update Session
// ------------------------------
// router.post("/save-session", async (req, res) => {
//   try {
//     const {
//       patient_first_name,
//       patient_last_name,
//       patient_mobile_no,
//       score,
//       duration,
//       exercise_type,
//       initial_rom,
//       current_rom
//     } = req.body;

//     // progress calculation
//     const progress = current_rom - initial_rom;

//     // Check if mobile number exists
//     let session = await Session.findOne({ patient_mobile_no });

//     if (!session) {
//       // NEW RECORD
//       session = new Session({
//         patient_first_name,
//         patient_last_name,
//         patient_mobile_no,
//         score,
//         duration,
//         exercise_type,
//         initial_rom,
//         current_rom,
//         progress
//       });

//       await session.save();
//       return res.json({ success: true, message: "New session saved", session });
//     }

//     // UPDATE EXISTING RECORD
//     session.patient_first_name = patient_first_name;
//     session.patient_last_name = patient_last_name;
//     session.score = score;
//     session.duration = duration;
//     session.exercise_type = exercise_type;
//     session.initial_rom = initial_rom;  
//     session.current_rom = current_rom;
//     session.progress = progress;
//     session.updatedAt = Date.now();

//     await session.save();

//     return res.json({ success: true, message: "Session updated", session });

//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

router.post("/save-session", async (req, res) => {
    try {
      const {
        patient_first_name,
        patient_last_name,
        patient_mobile_no,
        patient_DOB,
        patient_goals,
        patient_injuries,
        patient_area_focus,
        initial_romLeft,
        current_romLeft,
        initial_romRight,
        current_romRight,
        scoreLeft,
        scoreRight,
        totalScore,
        duration,
        exercise_type
      } = req.body;
  
      // Calculate progress for left and right (only if values are provided)
      const progressLeft = (initial_romLeft !== undefined && initial_romLeft !== "" && 
                            current_romLeft !== undefined && current_romLeft !== "") 
                            ? parseFloat(current_romLeft) - parseFloat(initial_romLeft) 
                            : null;
      
      const progressRight = (initial_romRight !== undefined && initial_romRight !== "" && 
                             current_romRight !== undefined && current_romRight !== "") 
                             ? parseFloat(current_romRight) - parseFloat(initial_romRight) 
                             : null;
  
      // Helper function to convert empty strings to null
      const toNumberOrNull = (value) => {
        if (value === undefined || value === "" || value === null) return null;
        return parseFloat(value);
      };
  
      // Helper function to convert empty strings to empty string
      const toStringOrEmpty = (value) => {
        if (value === undefined || value === null) return "";
        return String(value);
      };
  
      // Check mobile exists
      let patient = await Session.findOne({ patient_mobile_no });
  
      // ----------------------------------------------------
      // CASE 1 — Patient Not Found → Create New Record
      // ----------------------------------------------------
      if (!patient) {
        const newRecord = new Session({
          patient_first_name,
          patient_last_name,
          patient_mobile_no,
          patient_DOB: toStringOrEmpty(patient_DOB),
          patient_goals: toStringOrEmpty(patient_goals),
          patient_injuries: toStringOrEmpty(patient_injuries),
          patient_area_focus: toStringOrEmpty(patient_area_focus),
          exercise_history: [
            {
              exercise_type,
              scoreLeft: toNumberOrNull(scoreLeft),
              scoreRight: toNumberOrNull(scoreRight),
              current_total_score: toNumberOrNull(totalScore),
              duration,
              initial_romLeft: toNumberOrNull(initial_romLeft),
              current_romLeft: toNumberOrNull(current_romLeft),
              initial_romRight: toNumberOrNull(initial_romRight),
              current_romRight: toNumberOrNull(current_romRight),
              progressLeft,
              progressRight
            }
          ]
        });
  
        await newRecord.save();
  
        return res.json({
          success: true,
          message: "New session saved",
          session: newRecord
        });
      }
  
      // ----------------------------------------------------
      // CASE 2 — Patient Found → Update or Add Exercise
      // ----------------------------------------------------
  
      // Update patient info
      patient.patient_first_name = patient_first_name;
      patient.patient_last_name = patient_last_name;
      if (patient_DOB !== undefined) patient.patient_DOB = toStringOrEmpty(patient_DOB);
      if (patient_goals !== undefined) patient.patient_goals = toStringOrEmpty(patient_goals);
      if (patient_injuries !== undefined) patient.patient_injuries = toStringOrEmpty(patient_injuries);
      if (patient_area_focus !== undefined) patient.patient_area_focus = toStringOrEmpty(patient_area_focus);
  
      // check existing exercise
      const exercise = patient.exercise_history.find(
        (ex) => ex.exercise_type === exercise_type
      );
  
      // If exercise exists → update
      if (exercise) {
        // Store previous values before updating
        exercise.last_scoreLeft = exercise.scoreLeft;
        exercise.last_scoreRight = exercise.scoreRight;
        exercise.last_romLeft = exercise.current_romLeft;
        exercise.last_romRight = exercise.current_romRight;
        exercise.last_total_score = exercise.current_total_score;
  
        // Update with new values
        if (scoreLeft !== undefined) exercise.scoreLeft = toNumberOrNull(scoreLeft);
        if (scoreRight !== undefined) exercise.scoreRight = toNumberOrNull(scoreRight);
        if (totalScore !== undefined) exercise.current_total_score = toNumberOrNull(totalScore);
        if (duration !== undefined) exercise.duration = duration;
        
        // Update ROM values
        if (current_romLeft !== undefined) {
          exercise.current_romLeft = toNumberOrNull(current_romLeft);
          // Recalculate progressLeft based on initial_romLeft (preserve initial if not provided)
          if (exercise.initial_romLeft !== null && exercise.current_romLeft !== null) {
            exercise.progressLeft = exercise.current_romLeft - exercise.initial_romLeft;
          }
        }
        if (current_romRight !== undefined) {
          exercise.current_romRight = toNumberOrNull(current_romRight);
          // Recalculate progressRight based on initial_romRight (preserve initial if not provided)
          if (exercise.initial_romRight !== null && exercise.current_romRight !== null) {
            exercise.progressRight = exercise.current_romRight - exercise.initial_romRight;
          }
        }
        
        // Update initial ROM values if provided (only set once, or allow update)
        if (initial_romLeft !== undefined && initial_romLeft !== "") {
          exercise.initial_romLeft = toNumberOrNull(initial_romLeft);
          // Recalculate progressLeft if current_romLeft exists
          if (exercise.current_romLeft !== null && exercise.initial_romLeft !== null) {
            exercise.progressLeft = exercise.current_romLeft - exercise.initial_romLeft;
          }
        }
        if (initial_romRight !== undefined && initial_romRight !== "") {
          exercise.initial_romRight = toNumberOrNull(initial_romRight);
          // Recalculate progressRight if current_romRight exists
          if (exercise.current_romRight !== null && exercise.initial_romRight !== null) {
            exercise.progressRight = exercise.current_romRight - exercise.initial_romRight;
          }
        }
      } else {
        // If exercise does NOT exist → add new block
        patient.exercise_history.push({
          exercise_type,
          scoreLeft: toNumberOrNull(scoreLeft),
          scoreRight: toNumberOrNull(scoreRight),
          current_total_score: toNumberOrNull(totalScore),
          duration,
          initial_romLeft: toNumberOrNull(initial_romLeft),
          current_romLeft: toNumberOrNull(current_romLeft),
          initial_romRight: toNumberOrNull(initial_romRight),
          current_romRight: toNumberOrNull(current_romRight),
          progressLeft,
          progressRight
        });
      }
  
      patient.updatedAt = Date.now();
      await patient.save();
  
      return res.json({
        success: true,
        message: "Session updated",
        session: patient
      });
  
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  

// ------------------------------
// API 2: Get All Sessions
// ------------------------------
// router.get("/all-sessions", async (req, res) => {
//   try {
//     const sessions = await Session.find();
//     return res.json({ success: true, sessions });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// ------------------------------
// API 2: Get All Sessions
// ------------------------------

router.get("/all-sessions", async (req, res) => {
    try {
      const data = await Session.find();
      
      // Transform data to required format
      const formattedData = data.map((session, index) => {
        // Transform exercise_history to include only required fields
        const exerciseHistory = session.exercise_history.map((exercise) => ({
          exercise_type: exercise.exercise_type || null,
          current_total_score: exercise.current_total_score ?? null,
          last_total_score: exercise.last_total_score ?? null,
          duration: exercise.duration || null,
          current_romLeft: exercise.current_romLeft ?? null,
          last_romLeft: exercise.last_romLeft ?? null,
          current_romRight: exercise.current_romRight ?? null,
          last_romRight: exercise.last_romRight ?? null
        }));

        return {
          id: index + 1,
          name: `${session.patient_first_name || ""} ${session.patient_last_name || ""}`.trim() || null,
          phone: session.patient_mobile_no || null,
          injuryType: session.patient_injuries || null,
          date: session.patient_DOB || null,
          exercise_history: exerciseHistory
        };
      });

      return res.json(formattedData);
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });



// ---------------------------------------------------------------------------
// API 2: Get Sessions for specific user against Mobile_No and exercise_type 
// --------------------------------------------------------------------------

router.get("/session", async (req, res) => {
    try {
      const { patient_mobile_no, exercise_type } = req.query;
  
      if (!patient_mobile_no || !exercise_type) {
        return res.status(400).json({
          success: false,
          message: "patient_mobile_no and exercise_type are required"
        });
      }
  
      // 1. Find patient
      const patient = await Session.findOne({ patient_mobile_no });
  
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "No patient found for this mobile number"
        });
      }
  
      // 2. Case-insensitive + trim match for exercise_type
      const exerciseData = patient.exercise_history.find(
        (ex) =>
          ex.exercise_type.toLowerCase().trim() ===
          exercise_type.toLowerCase().trim()
      );
  
      if (!exerciseData) {
        return res.status(404).json({
          success: false,
          message: "Exercise type not found for this patient"
        });
      }
  
      // 3. Return specific record
      return res.json({
        success: true,
        patient_mobile_no: patient.patient_mobile_no,
        patient_first_name: patient.patient_first_name,
        patient_last_name: patient.patient_last_name,
        exercise: exerciseData
      });
  
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  
  

module.exports = router;
