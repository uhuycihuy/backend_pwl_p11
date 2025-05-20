import mongoose from "mongoose";

const LogActivitySchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Object,
    default: {}
  }
});

const LogActivity = mongoose.model("LogActivity", LogActivitySchema);
export default LogActivity;
