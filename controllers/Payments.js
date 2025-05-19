import Payment from "../models/PaymentModel.js";
import Product from "../models/ProductModel.js";
import User from "../models/UserModel.js";
// import { Op } from "sequelize";

export const getPayments = async (req, res) => {
    try {
        let payments;
        
        if (req.role === "admin") {
            // Admin bisa melihat semua payment dengan detail lengkap
            payments = await Payment.findAll({
                attributes: ['uuid', 'nama_pembeli', 'nama_produk', 'jumlah', 'total_harga', 'tanggal'],
                include: [
                    {
                        model: User,
                        attributes: ['name', 'email']
                    },
                    {
                        model: Product,
                        attributes: ['name', 'price']
                    }
                ],
                order: [['tanggal', 'DESC']] // Urutkan dari yang terbaru
            });
        } else {
            // User hanya bisa melihat payment mereka sendiri
            payments = await Payment.findAll({
                attributes: ['uuid', 'nama_produk', 'jumlah', 'total_harga', 'tanggal'],
                where: {
                    userId: req.userId
                },
                include: {
                    model: Product,
                    attributes: ['name', 'price']
                },
                order: [['tanggal', 'DESC']]
            });
        }

        res.status(200).json(payments);
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ msg: "Gagal mengambil data pembayaran" });
    }
};

export const getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findOne({
            where: {
                uuid: req.params.id
            }
        });

        if (!payment) {
            return res.status(404).json({ msg: "Pembayaran tidak ditemukan" });
        }

        // Authorization check
        if (req.role !== "admin" && payment.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses tidak diizinkan" });
        }

        const paymentDetail = await Payment.findOne({
            attributes: ['uuid', 'nama_pembeli', 'nama_produk', 'jumlah', 'total_harga', 'tanggal'],
            where: { id: payment.id },
            include: [
                {
                    model: User,
                    attributes: req.role === "admin" ? ['name', 'email'] : []
                },
                {
                    model: Product,
                    attributes: ['name', 'price']
                }
            ]
        });

        res.status(200).json(paymentDetail);
    } catch (error) {
        console.error("Error fetching payment detail:", error);
        res.status(500).json({ msg: "Gagal mengambil detail pembayaran" });
    }
};

export const createPayment = async (req, res) => {
    // Validasi dasar
    if (!req.userId) {
        return res.status(401).json({ msg: "Anda harus login terlebih dahulu" });
    }

    const { nama_pembeli, productId, jumlah } = req.body;
    
    // Validasi input
    if (!nama_pembeli || !productId || !jumlah) {
        return res.status(400).json({ msg: "Nama pembeli, produk, dan jumlah harus diisi" });
    }

    if (jumlah < 1) {
        return res.status(400).json({ msg: "Jumlah harus minimal 1" });
    }

    try {
        // Cari produk termasuk ID numerik
        const product = await Product.findOne({ 
            where: { uuid: productId },
            attributes: ['id', 'name', 'price']
        });

        if (!product) {
            return res.status(404).json({ msg: "Produk tidak ditemukan" });
        }

        // Hitung total harga
        const total_harga = product.price * jumlah;

        // Buat payment record - TETAP menggunakan format awal
        const newPayment = await Payment.create({
            nama_pembeli,
            nama_produk: product.name,
            jumlah,
            total_harga,
            userId: req.userId,
            productId: product.id // Gunakan ID numerik
        });

        // FORMAT RESPONSE TIDAK DIUBAH (sesuai database)
        const response = {
            uuid: newPayment.uuid,
            nama_pembeli: newPayment.nama_pembeli,
            nama_produk: newPayment.nama_produk,
            jumlah: newPayment.jumlah,
            total_harga: newPayment.total_harga,
            tanggal: newPayment.createdAt
        };

        res.status(201).json({ 
            msg: "Pembayaran berhasil dibuat",
            payment: response // Format tetap sama
        });

    } catch (error) {
        console.error("Error creating payment:", error);
        
        // Error handling tetap sama
        if (error.name === "SequelizeValidationError") {
            return res.status(400).json({ 
                msg: "Validasi gagal",
                errors: error.errors.map(e => e.message) 
            });
        }
        
        res.status(500).json({ 
            msg: "Gagal membuat pembayaran",
            systemError: error.message // Tambahkan detail error untuk debugging
        });
    }
};