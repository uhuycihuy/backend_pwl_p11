import LogActivity from "../models/LogActivityModel.js";

export const getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;     // Halaman keberapa
    const limit = parseInt(req.query.limit) || 10;  // Jumlah per halaman
    const offset = page * limit;                    // Skip data untuk pagination

    const totalLogs = await LogActivity.countDocuments(); // Total data
    const totalPage = Math.ceil(totalLogs / limit);       // Total halaman

    const logs = await LogActivity.find()
      .sort({ createdAt: -1 })     // Urut terbaru
      .skip(offset)
      .limit(limit);

    res.status(200).json({
      result: logs,                // Array log
      page: page,
      limit: limit,
      totalRows: totalLogs,
      totalPage: totalPage
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
