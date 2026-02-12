import { Request, Response } from 'express';

export const getSalesReport = (req: Request, res: Response) => {
  const mockReport = {
    totalRevenue: 7500000,
    totalOrders: 2,
    averageOrderValue: 3750000,
    orders: [
      { id: 1, property: "Luxury Apartment", amount: 2500000, date: "2024-03-15" },
      { id: 2, property: "Beach Villa", amount: 5000000, date: "2024-03-20" }
    ]
  };
  
  res.json(mockReport);
};

export const getPropertyReport = (req: Request, res: Response) => {
  const mockReport = [
    {
      propertyId: 1,
      propertyName: "Luxury Apartment Jakarta",
      totalBookings: 5,
      totalRevenue: 12500000,
      occupancyRate: "75%"
    },
    {
      propertyId: 2,
      propertyName: "Beach Villa Bali",
      totalBookings: 3,
      totalRevenue: 15000000,
      occupancyRate: "60%"
    }
  ];
  
  res.json(mockReport);
};