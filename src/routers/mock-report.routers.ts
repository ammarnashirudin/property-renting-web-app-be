import { Router } from 'express';
import { getSalesReport, getPropertyReport } from '../controllers/mock-report.controller';

const router = Router();

router.get('/sales', getSalesReport);
router.get('/properties', getPropertyReport);

export default router;