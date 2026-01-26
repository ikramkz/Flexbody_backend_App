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
              current_total_score_date: (toNumberOrNull(totalScore) !== null) ? new Date() : null,
              duration,
              initial_romLeft: toNumberOrNull(initial_romLeft),
              current_romLeft: toNumberOrNull(current_romLeft),
              current_romLeft_date: (toNumberOrNull(current_romLeft) !== null) ? new Date() : null,
              initial_romRight: toNumberOrNull(initial_romRight),
              current_romRight: toNumberOrNull(current_romRight),
              current_romRight_date: (toNumberOrNull(current_romRight) !== null) ? new Date() : null,
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

        // Update with new values
        if (scoreLeft !== undefined) exercise.scoreLeft = toNumberOrNull(scoreLeft);
        if (scoreRight !== undefined) exercise.scoreRight = toNumberOrNull(scoreRight);
        if (duration !== undefined) exercise.duration = duration;
        
        // Update total_score with history tracking (shift values when new totalScore arrives)
        if (totalScore !== undefined && totalScore !== "") {
          const newTotalScore = toNumberOrNull(totalScore);
          // Only shift if there's an existing current value AND new value is not null (new assessment)
          if (exercise.current_total_score !== null && exercise.current_total_score !== undefined && newTotalScore !== null) {
            // Store OLD values before shifting (these are the values that will be shifted)
            const oldCurrentTotalScore = exercise.current_total_score; // This will become last_total_score
            const oldLastTotalScore = exercise.last_total_score; // This will become third_total_score
            const oldThirdTotalScore = exercise.third_total_score; // This will become forth_total_score
            const oldForthTotalScore = exercise.forth_total_score; // This will become fifth_total_score
            
            // Store dates before shifting (to shift them in opposite direction)
            const oldCurrentDate = exercise.current_total_score_date; // Current date that will become last_date
            const oldLastDate = exercise.last_total_score_date;
            const oldThirdDate = exercise.third_total_score_date;
            const oldForthDate = exercise.forth_total_score_date;
            
            // Shift history: fifth is removed, values shift down
            exercise.fifth_total_score = oldForthTotalScore;
            exercise.forth_total_score = oldThirdTotalScore;
            exercise.third_total_score = oldLastTotalScore;
            exercise.last_total_score = oldCurrentTotalScore;
            
            // Dates shift: current_date → last_date → third_date → forth_date → fifth_date
            // last gets the old current_date (from previous assessment)
            if (oldCurrentTotalScore !== null && oldCurrentTotalScore !== undefined) {
              exercise.last_total_score_date = oldCurrentDate || new Date();
            } else {
              exercise.last_total_score_date = null;
            }
            
            // third gets last's old date
            if (oldLastTotalScore !== null && oldLastTotalScore !== undefined) {
              exercise.third_total_score_date = oldLastDate;
            } else {
              exercise.third_total_score_date = null;
            }
            
            // forth gets third's old date
            if (oldThirdTotalScore !== null && oldThirdTotalScore !== undefined) {
              exercise.forth_total_score_date = oldThirdDate;
            } else {
              exercise.forth_total_score_date = null;
            }
            
            // fifth gets forth's old date (fifth_date is removed/overwritten)
            if (oldForthTotalScore !== null && oldForthTotalScore !== undefined) {
              exercise.fifth_total_score_date = oldForthDate;
            } else {
              exercise.fifth_total_score_date = null;
            }
          }
          exercise.current_total_score = newTotalScore;
          // Set current_total_score_date to current date/time when new value arrives
          if (newTotalScore !== null && newTotalScore !== undefined) {
            exercise.current_total_score_date = new Date();
          } else {
            exercise.current_total_score_date = null;
          }
        }
        
        // Update ROM values with history tracking (shift values when new ROM arrives)
        if (current_romLeft !== undefined && current_romLeft !== "") {
          const newRomLeft = toNumberOrNull(current_romLeft);
          // Only shift if there's an existing current value AND new value is not null (new assessment)
          if (exercise.current_romLeft !== null && exercise.current_romLeft !== undefined && newRomLeft !== null) {
            // Store the value that will be assigned to left_rom2
            const valueForRom2 = exercise.last_romLeft;
            
            // Store dates before shifting (to shift them in opposite direction)
            const oldCurrentDate = exercise.current_romLeft_date; // Current date that will become rom2_date
            const oldRom2Date = exercise.left_rom2_date;
            const oldRom3Date = exercise.left_rom3_date;
            const oldRom4Date = exercise.left_rom4_date;
            const oldRom5Date = exercise.left_rom5_date;
            
            // Shift history: rom5 is removed, values shift down
            exercise.left_rom5 = exercise.left_rom4;
            exercise.left_rom4 = exercise.left_rom3;
            exercise.left_rom3 = exercise.left_rom2;
            exercise.left_rom2 = valueForRom2;
            exercise.last_romLeft = exercise.current_romLeft;
            
            // Dates shift: current_date → rom2_date → rom3_date → rom4_date → rom5_date
            const currentDate = new Date();
            
            // rom2 gets the old current_date (from previous assessment)
            if (valueForRom2 !== null && valueForRom2 !== undefined) {
              exercise.left_rom2_date = oldCurrentDate || currentDate;
            } else {
              exercise.left_rom2_date = null;
            }
            
            // rom3 gets rom2's old date
            if (exercise.left_rom3 !== null && exercise.left_rom3 !== undefined) {
              exercise.left_rom3_date = oldRom2Date;
            } else {
              exercise.left_rom3_date = null;
            }
            
            // rom4 gets rom3's old date
            if (exercise.left_rom4 !== null && exercise.left_rom4 !== undefined) {
              exercise.left_rom4_date = oldRom3Date;
            } else {
              exercise.left_rom4_date = null;
            }
            
            // rom5 gets rom4's old date (rom5_date is removed/overwritten)
            if (exercise.left_rom5 !== null && exercise.left_rom5 !== undefined) {
              exercise.left_rom5_date = oldRom4Date;
            } else {
              exercise.left_rom5_date = null;
            }
          }
          exercise.current_romLeft = newRomLeft;
          // Set current_romLeft_date to current date/time when new value arrives
          if (newRomLeft !== null && newRomLeft !== undefined) {
            exercise.current_romLeft_date = new Date();
          } else {
            exercise.current_romLeft_date = null;
          }
          // Recalculate progressLeft based on initial_romLeft (preserve initial if not provided)
          if (exercise.initial_romLeft !== null && exercise.current_romLeft !== null) {
            exercise.progressLeft = exercise.current_romLeft - exercise.initial_romLeft;
          }
        }
        if (current_romRight !== undefined && current_romRight !== "") {
          const newRomRight = toNumberOrNull(current_romRight);
          // Only shift if there's an existing current value AND new value is not null (new assessment)
          if (exercise.current_romRight !== null && exercise.current_romRight !== undefined && newRomRight !== null) {
            // Store the value that will be assigned to right_rom2
            const valueForRom2 = exercise.last_romRight;
            
            // Store dates before shifting (to shift them in opposite direction)
            const oldCurrentDate = exercise.current_romRight_date; // Current date that will become rom2_date
            const oldRom2Date = exercise.right_rom2_date;
            const oldRom3Date = exercise.right_rom3_date;
            const oldRom4Date = exercise.right_rom4_date;
            const oldRom5Date = exercise.right_rom5_date;
            
            // Shift history: rom5 is removed, values shift down
            exercise.right_rom5 = exercise.right_rom4;
            exercise.right_rom4 = exercise.right_rom3;
            exercise.right_rom3 = exercise.right_rom2;
            exercise.right_rom2 = valueForRom2;
            exercise.last_romRight = exercise.current_romRight;
            
            // Dates shift: current_date → rom2_date → rom3_date → rom4_date → rom5_date
            const currentDate = new Date();
            
            // rom2 gets the old current_date (from previous assessment)
            if (valueForRom2 !== null && valueForRom2 !== undefined) {
              exercise.right_rom2_date = oldCurrentDate || currentDate;
            } else {
              exercise.right_rom2_date = null;
            }
            
            // rom3 gets rom2's old date
            if (exercise.right_rom3 !== null && exercise.right_rom3 !== undefined) {
              exercise.right_rom3_date = oldRom2Date;
            } else {
              exercise.right_rom3_date = null;
            }
            
            // rom4 gets rom3's old date
            if (exercise.right_rom4 !== null && exercise.right_rom4 !== undefined) {
              exercise.right_rom4_date = oldRom3Date;
            } else {
              exercise.right_rom4_date = null;
            }
            
            // rom5 gets rom4's old date (rom5_date is removed/overwritten)
            if (exercise.right_rom5 !== null && exercise.right_rom5 !== undefined) {
              exercise.right_rom5_date = oldRom4Date;
            } else {
              exercise.right_rom5_date = null;
            }
          }
          exercise.current_romRight = newRomRight;
          // Set current_romRight_date to current date/time when new value arrives
          if (newRomRight !== null && newRomRight !== undefined) {
            exercise.current_romRight_date = new Date();
          } else {
            exercise.current_romRight_date = null;
          }
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
          current_total_score_date: (toNumberOrNull(totalScore) !== null) ? new Date() : null,
          duration,
          initial_romLeft: toNumberOrNull(initial_romLeft),
          current_romLeft: toNumberOrNull(current_romLeft),
          current_romLeft_date: (toNumberOrNull(current_romLeft) !== null) ? new Date() : null,
          initial_romRight: toNumberOrNull(initial_romRight),
          current_romRight: toNumberOrNull(current_romRight),
          current_romRight_date: (toNumberOrNull(current_romRight) !== null) ? new Date() : null,
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
          current_total_score_date: exercise.current_total_score_date ?? null,
          last_total_score: exercise.last_total_score ?? null,
          last_total_score_date: exercise.last_total_score_date ?? null,
          third_total_score: exercise.third_total_score ?? null,
          third_total_score_date: exercise.third_total_score_date ?? null,
          forth_total_score: exercise.forth_total_score ?? null,
          forth_total_score_date: exercise.forth_total_score_date ?? null,
          fifth_total_score: exercise.fifth_total_score ?? null,
          fifth_total_score_date: exercise.fifth_total_score_date ?? null,
          duration: exercise.duration || null,
          current_romLeft: exercise.current_romLeft ?? null,
          current_romLeft_date: exercise.current_romLeft_date ?? null,
          last_romLeft: exercise.last_romLeft ?? null,
          current_romRight: exercise.current_romRight ?? null,
          current_romRight_date: exercise.current_romRight_date ?? null,
          last_romRight: exercise.last_romRight ?? null,
          // ROM history fields (last 5 records including current)
          left_rom2: exercise.left_rom2 ?? null,
          left_rom3: exercise.left_rom3 ?? null,
          left_rom4: exercise.left_rom4 ?? null,
          left_rom5: exercise.left_rom5 ?? null,
          right_rom2: exercise.right_rom2 ?? null,
          right_rom3: exercise.right_rom3 ?? null,
          right_rom4: exercise.right_rom4 ?? null,
          right_rom5: exercise.right_rom5 ?? null,
          // Date/time fields for ROM history (only present when value is not null)
          left_rom2_date: exercise.left_rom2_date ?? null,
          left_rom3_date: exercise.left_rom3_date ?? null,
          left_rom4_date: exercise.left_rom4_date ?? null,
          left_rom5_date: exercise.left_rom5_date ?? null,
          right_rom2_date: exercise.right_rom2_date ?? null,
          right_rom3_date: exercise.right_rom3_date ?? null,
          right_rom4_date: exercise.right_rom4_date ?? null,
          right_rom5_date: exercise.right_rom5_date ?? null
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
