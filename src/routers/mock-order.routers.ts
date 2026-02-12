import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  uploadPaymentProof,
  getTenantOrders,
  confirmPayment,
  cancelOrder
} from '../controllers/mock-order.controller';

const router = Router();

// User routes
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.post('/:id/payment-proof', uploadPaymentProof);

// Tenant routes
router.get('/tenant/orders', getTenantOrders);
router.put('/:id/confirm', confirmPayment);
router.put('/:id/cancel', cancelOrder);

export default router;