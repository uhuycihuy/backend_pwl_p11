import express from "express";
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from "../controllers/Products.js";
import {  verifyUser, adminOnly } from "../middleware/AuthUser.js";

const router = express.Router();

router.get('/products', verifyUser, getProducts);
router.get('/products/:id', verifyUser, getProductById);
router.post('/products', verifyUser, adminOnly, createProduct);
router.patch('/products/:id', verifyUser, adminOnly, updateProduct);
router.delete('/products/:id', verifyUser, adminOnly, deleteProduct);

export default router;