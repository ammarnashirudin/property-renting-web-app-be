import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middlewares';
import upload from '../middlewares/upload.middlewares';
import { orderController } from '../controllers/order.controller';

const router = Router();

// User routes
router.post('/', authMiddleware, orderController.createOrder);
router.get('/my-orders', authMiddleware, orderController.getUserOrders);
router.post('/:id/payment', authMiddleware, upload.single('paymentProof'), orderController.uploadPayment);
router.put('/:id/cancel', authMiddleware, orderController.cancelOrder);

// Tenant routes
router.get('/tenant/orders', authMiddleware, orderController.getTenantOrders);
router.put('/:id/confirm', authMiddleware, orderController.confirmPayment);
router.put('/:id/reject', authMiddleware, orderController.rejectPayment);

// Reports
router.get('/reports/sales', authMiddleware, orderController.getSalesReport);
router.get('/reports/properties', authMiddleware, orderController.getPropertyReport);

// Reviews
router.post('/:id/review', authMiddleware, orderController.createReview);

export default router;