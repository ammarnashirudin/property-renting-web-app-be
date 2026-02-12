import { Router } from 'express';
import { calendarController } from '../controllers/calendar.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Tenant routes
router.get('/property/:propertyId', authMiddleware, calendarController.getPropertyCalendar);

// Public route to get available rooms for a property in a given month and year
router.get('/available-rooms', calendarController.getAvailableRooms);

export default router;