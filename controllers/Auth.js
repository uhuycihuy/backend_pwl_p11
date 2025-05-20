import User from "../models/UserModel.js";
import argon2 from "argon2";
import { logActivity } from "../utils/Logger.js"; // ✅ Tambahkan ini

export const Login = async (req, res) => {
    const user = await User.findOne({
        where: {
            email: req.body.email
        }
    });

    if (!user) {
        await logActivity("UNKNOWN", "LOGIN_GAGAL", { email: req.body.email });
        return res.status(404).json({ msg: "User tidak ditemukan" });
    }

    const match = await argon2.verify(user.password, req.body.password);
    if (!match) {
        await logActivity(user.name, "LOGIN_PASSWORD_SALAH", { email: user.email });
        return res.status(400).json({ msg: "Wrong Password" });
    }

    req.session.userId = user.uuid;
    const { uuid, name, email, role } = user;

    // ✅ Logging jika berhasil login
    await logActivity(name, "LOGIN_BERHASIL", { email });

    res.status(200).json({ uuid, name, email, role });
};

export const Me = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ msg: "Mohon login ke akun Anda!" });
    }

    const user = await User.findOne({
        attributes: ['uuid', 'name', 'email', 'role'],
        where: {
            uuid: req.session.userId
        }
    });

    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

    res.status(200).json(user);
};

export const logOut = (req, res) => {
    const userId = req.session.userId;

    // Cari data user untuk logging sebelum logout
    User.findOne({ where: { uuid: userId } }).then(async (user) => {
        if (user) {
            await logActivity(user.name, "LOGOUT", { email: user.email });
        }
        req.session.destroy((err) => {
            if (err) return res.status(400).json({ msg: "Tidak dapat logout" });
            res.status(200).json({ msg: "Anda telah logout" });
        });
    }).catch(() => {
        res.status(400).json({ msg: "Terjadi kesalahan saat logout" });
    });
};
