import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import upload from '../middlewares/uploud.middleware';
import { orderController } from '../controllers/order.controller';
import { tenantOrderController } from '@/controllers/tenantOrder.controller';
import { reportController } from '@/controllers/report.controller';
import { reviewController } from '@/controllers/review.controller';

const router = Router();

// User routes
router.post('/', authMiddleware, orderController.createOrder);
router.get('/my-orders', authMiddleware, orderController.getMyOrders);
router.post('/:id/payment', authMiddleware, upload.single('paymentProof'), orderController.uploadPaymentProof);
router.put('/:id/cancel', authMiddleware, orderController.cancelOrder);

// Tenant routes
router.get('/tenant/orders', authMiddleware, tenantOrderController.getTenantOrders);
router.put('/:id/confirm', authMiddleware, tenantOrderController.confirmPayment);
router.put('/:id/reject', authMiddleware, tenantOrderController.rejectPayment);

// Reports
router.get('/reports/sales', authMiddleware, reportController.getSalesReport);
router.get('/reports/properties', authMiddleware, reportController.getPropertyReport);

// Reviews
router.post('/:id/review', authMiddleware, reviewController.createReview);

export default router;