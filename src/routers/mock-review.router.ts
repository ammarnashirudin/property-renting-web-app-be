import { Router } from 'express';
import { createReview, getPropertyReviews, getUserReviews } from '../controllers/mock-review.controller';

const router = Router();

router.post('/', createReview);
router.get('/property/:propertyId', getPropertyReviews);
router.get('/my-reviews', getUserReviews);

export default router;