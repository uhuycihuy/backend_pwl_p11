import LogActivity from "../models/LogActivityModel.js";

export const logActivity = async (user, action, metadata = {}) => {
  try {
    await LogActivity.create({ user, action, metadata });
    console.log(`[LOG] ${user} melakukan aksi: ${action}`);
  } catch (err) {
    console.error("Gagal menyimpan log aktivitas:", err);
  }
};
