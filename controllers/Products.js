import Product from "../models/ProductModel.js";
import path from "path";
import fs from "fs";
// import { Op } from "sequelize";
import User from "../models/UserModel.js";
import { logActivity } from "../utils/Logger.js";

export const getProducts = async (req, res) => {
    try {
        const response = await Product.findAll({
            attributes: ['uuid', 'name', 'price', 'gambar', 'url'],
            include: [{
                model: User,
                attributes: ['name', 'email']
            }]
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}


export const getProductById = async (req, res) => {
    try {
        const product = await Product.findOne({
            attributes: ['uuid', 'name', 'price', 'gambar', 'url'],
            where: {
                uuid: req.params.id
            },
            include: [{
                model: User,
                attributes: ['name', 'email']
            }]
        });

        if (!product) return res.status(404).json({ msg: "Data tidak ditemukan" });

        // Tidak perlu pembatasan role/userId
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const createProduct = async (req, res) => {
    // Only admin can create products
    if(req.role !== "admin") {
        return res.status(403).json({msg: "Akses terlarang"});
    }

    // Validate image upload
    if (!req.files || !req.files.file) {
        return res.status(400).json({ msg: "Tidak ada file yang diupload" });
    }

    const { name, price } = req.body;
    const file = req.files.file;
    const fileSize = file.data.length;
    const ext = path.extname(file.name).toLowerCase();
    const allowedTypes = [".png", ".jpg", ".jpeg"];

    // Validate required fields
    if (!name || !price) {
        return res.status(400).json({ msg: "Nama dan harga wajib diisi" });
    }

    // Validate file type
    if (!allowedTypes.includes(ext)) {
        return res.status(422).json({ msg: "Tipe file tidak valid. Gunakan PNG, JPG, atau JPEG" });
    }

    // Validate file size (5MB max)
    if (fileSize > 5 * 1024 * 1024) {
        return res.status(422).json({ msg: "Ukuran gambar maksimal 5MB" });
    }

    // Generate unique filename
    const fileName = file.md5 + ext;
    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;
    const uploadPath = `./public/images/${fileName}`;

    try {
        // Move file to public/images
        await file.mv(uploadPath);

        // Create product in database
        await Product.create({
            name: name,
            price: price,
            userId: req.userId,
            gambar: fileName,
            url: url
        });

        await logActivity(req.userId, "CREATE_PRODUCT", {
            name,
            price,
            gambar: fileName,
            url
        });

        res.status(201).json({msg: "Product created successfully"});
    } catch (error) {
        console.error("Failed to create product:", error);

        // Delete uploaded file if error occurs
        if (fs.existsSync(uploadPath)) {
            fs.unlinkSync(uploadPath);
        }

        // Handle validation errors
        if (error.name === "SequelizeValidationError") {
            return res.status(400).json({
                msg: error.errors.map(e => e.message).join(", ")
            });
        }

        res.status(500).json({msg: "Terjadi kesalahan pada server"});
    }
}

export const updateProduct = async (req, res) => {
    // Only admin can update products
    if(req.role !== "admin") {
        return res.status(403).json({msg: "Akses terlarang"});
    }

    try {
        const product = await Product.findOne({
            where:{
                uuid: req.params.id
            }
        });
        if(!product) return res.status(404).json({msg: "Data tidak ditemukan"});

        const { name, price } = req.body;

        // Default: use old image
        let fileName = product.gambar;
        let url = product.url;

        // If new image is uploaded
        if (req.files && req.files.file) {
            const file = req.files.file;
            const fileSize = file.data.length;
            const ext = path.extname(file.name).toLowerCase();
            fileName = file.md5 + ext;
            const allowedTypes = [".png", ".jpg", ".jpeg"];

            // Validate file type
            if (!allowedTypes.includes(ext)) {
                return res.status(422).json({ msg: "Tipe file tidak valid" });
            }

            // Validate file size
            if (fileSize > 5 * 1024 * 1024) {
                return res.status(422).json({ msg: "Ukuran gambar maksimal 5MB" });
            }

            // Delete old image if exists
            if (product.gambar) {
                const oldFilePath = `./public/images/${product.gambar}`;
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            // Upload new image
            const newFilePath = `./public/images/${fileName}`;
            try {
                await file.mv(newFilePath);
            } catch (err) {
                return res.status(500).json({ msg: "Gagal upload file", error: err.message });
            }

            // Update image URL
            url = `${req.protocol}://${req.get("host")}/images/${fileName}`;
        }

        // Update product in database
        await Product.update(
            { name, price, gambar: fileName, url },
            { where: { id: product.id } }
        );

        await logActivity(req.userId, "UPDATE_PRODUCT", {
            productId: product.id,
            name,
            price,
            gambar: fileName,
            url
        });

        res.status(200).json({msg: "Product updated successfully"});
    } catch (error) {
        console.error(error.message);
        res.status(500).json({msg: "Terjadi kesalahan", error: error.message});
    }
}

export const deleteProduct = async (req, res) => {
    // Only admin can delete products
    if(req.role !== "admin") {
        return res.status(403).json({msg: "Akses terlarang"});
    }

    try {
        const product = await Product.findOne({
            where:{
                uuid: req.params.id
            }
        });
        if(!product) return res.status(404).json({msg: "Data tidak ditemukan"});

        // Delete image file if exists
        if (product.gambar) {
            const filePath = `./public/images/${product.gambar}`;
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await Product.destroy({
            where:{
                id: product.id
            }
        });

        await logActivity(req.userId, "DELETE_PRODUCT", {
            productId: product.id,
            name: product.name
        });

        res.status(200).json({msg: "Product deleted successfully"});
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}