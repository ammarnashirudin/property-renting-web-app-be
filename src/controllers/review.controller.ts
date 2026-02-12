import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { createCustomError } from '../utils/customError';

export const reviewController = {
  // review by User
  createReview: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      const { orderId, propertyId, rating, comment } = req.body;

      if (userRole !== 'USER') {
        throw createCustomError(403, "Hanya customer yang dapat memberikan review");
      }

      const order = await prisma.order.findFirst({
        where: {
          id: parseInt(orderId),
          userId,
          status: "confirmed"
        }
      });

      if (!order) throw createCustomError(403, "Anda belum booking properti ini");

      const existingReview = await prisma.review.findFirst({
        where: {
          orderId: parseInt(orderId),
          userId
        }
      });

      if (existingReview) throw createCustomError(400, "Anda sudah mereview order ini");

      const review = await prisma.review.create({
        data: {
          userId,
          propertyId: parseInt(propertyId),
          orderId: parseInt(orderId),
          rating: parseInt(rating),
          comment
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: "Review berhasil ditambahkan",
        data: review
      });
    } catch (error) {
      next(error);
    }
  },

  // get review for public
  getPropertyReviews: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.params;

      const reviews = await prisma.review.findMany({
        where: { propertyId: parseInt(propertyId) },
        include: {
          user: {
            select: { name: true, profileImage: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      res.json({
        success: true,
        data: {
          reviews,
          totalReviews: reviews.length,
          averageRating
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // REPLY TO REVIEW - Tenant only
  replyToReview: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reviewId } = req.params;
      const { reply } = req.body;
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (userRole !== 'TENANT') {
        throw createCustomError(403, "Hanya tenant yang dapat membalas review");
      }

      const tenant = await prisma.tenant.findUnique({
        where: { userId },
        include: {
          properties: {
            include: {
              reviews: {
                where: { id: parseInt(reviewId) }
              }
            }
          }
        }
      });

      if (!tenant) throw createCustomError(403, "Tenant tidak ditemukan");

      const review = await prisma.review.update({
        where: { id: parseInt(reviewId) },
        data: { reply },
        include: {
          user: {
            select: { name: true }
          }
        }
      });

      res.json({
        success: true,
        message: "Balasan berhasil ditambahkan",
        data: review
      });
    } catch (error) {
      next(error);
    }
  },

  // GET MY REVIEWS - User only
  getMyReviews: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (userRole !== 'USER') {
        throw createCustomError(403, "Akses ditolak");
      }

      const reviews = await prisma.review.findMany({
        where: { userId },
        include: {
          property: {
            select: { name: true, image: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: reviews
      });
    } catch (error) {
      next(error);
    }
  }
};