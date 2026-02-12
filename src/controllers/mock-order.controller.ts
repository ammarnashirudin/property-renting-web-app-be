import { Request, Response } from 'express';

// Mock data
let mockOrders = [
  {
    id: 1,
    propertyName: "Luxury Apartment Jakarta",
    tenantId: 1,
    userId: 2,
    checkIn: "2024-03-15",
    checkOut: "2024-03-20",
    totalPrice: 2500000,
    status: "Menunggu_Pembayaran",
    paymentProof: null,
    createdAt: "2024-03-10"
  },
  {
    id: 2,
    propertyName: "Beach Villa Bali", 
    tenantId: 1,
    userId: 3,
    checkIn: "2024-03-20",
    checkOut: "2024-03-25",
    totalPrice: 5000000,
    status: "Menunggu_Konfirmasi_Pembayaran",
    paymentProof: "payment.jpg",
    createdAt: "2024-03-11"
  }
];

// User: Create order
export const createOrder = (req: Request, res: Response) => {
  const { propertyName, checkIn, checkOut, totalPrice } = req.body;
  
  const newOrder = {
    id: mockOrders.length + 1,
    propertyName,
    tenantId: 1,
    userId: req.body.userId || 2,
    checkIn,
    checkOut,
    totalPrice,
    status: "Menunggu_Pembayaran",
    paymentProof: null,
    createdAt: new Date().toISOString()
  };
  
  mockOrders.push(newOrder);
  res.status(201).json(newOrder);
};

// User: Get my orders
export const getMyOrders = (req: Request, res: Response) => {
  const userId = 2;
  const orders = mockOrders.filter(o => o.userId === userId);
  res.json(orders);
};

// User: Upload payment proof
export const uploadPaymentProof = (req: Request, res: Response) => {
  const { id } = req.params;
  const order = mockOrders.find(o => o.id === parseInt(id));
  
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  
  order.paymentProof = "mock-payment.jpg";
  order.status = "Menunggu_Konfirmasi_Pembayaran";
  
  res.json(order);
};

// Tenant: Get all orders
export const getTenantOrders = (req: Request, res: Response) => {
  const tenantId = 1;
  const orders = mockOrders.filter(o => o.tenantId === tenantId);
  res.json(orders);
};

// Tenant: Confirm payment
export const confirmPayment = (req: Request, res: Response) => {
  const { id } = req.params;
  const order = mockOrders.find(o => o.id === parseInt(id));
  
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  
  order.status = "confirmed";
  res.json({ message: "Payment confirmed", order });
};

// Tenant: Cancel order
export const cancelOrder = (req: Request, res: Response) => {
  const { id } = req.params;
  const order = mockOrders.find(o => o.id === parseInt(id));
  
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  
  order.status = "Dibatalkan";
  res.json({ message: "Order cancelled", order });
};