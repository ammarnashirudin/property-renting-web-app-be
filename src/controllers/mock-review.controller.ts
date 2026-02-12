import { Request, Response } from 'express';

let mockReviews = [
  {
    id: 1,
    propertyId: 1,
    propertyName: "Luxury Apartment Jakarta",
    userId: 2,
    userName: "John Doe",
    rating: 4,
    comment: "Bagus, bersih, recommended!",
    createdAt: "2024-03-16"
  }
];

export const createReview = (req: Request, res: Response) => {
  const { propertyId, rating, comment } = req.body;
  
  const newReview = {
    id: mockReviews.length + 1,
    propertyId,
    propertyName: req.body.propertyName || "Property Name",
    userId: 2,
    userName: "John Doe",
    rating,
    comment,
    createdAt: new Date().toISOString()
  };
  
  mockReviews.push(newReview);
  res.status(201).json(newReview);
};

export const getPropertyReviews = (req: Request, res: Response) => {
  const { propertyId } = req.params;
  const reviews = mockReviews.filter(r => r.propertyId === parseInt(propertyId));
  res.json(reviews);
};

export const getUserReviews = (req: Request, res: Response) => {
  const userId = 2; // Mock user ID
  const reviews = mockReviews.filter(r => r.userId === userId);
  res.json(reviews);
};