import "dotenv/config";
console.log("MAIN FILE KEJALAN");

import express from "express";
import cors from "cors";
import helmet from "helmet";
import errorMiddleware from "./middlewares/error.middlewares";
import authRouter from "./routers/auth.router";
import userRouter from "./routers/user.router";
import categoryRouter from "./routers/category.router";
import propertyCatalogRouter from "./routers/propertyCatalog.router";
import propertyManagementRouter from "./routers/propertyManagement.router";
import roomManagementRouter from "./routers/roomManagement.router";
import locationRouter from "./routers/location.router";
import orderRouter from "./routers/order.router";

import { orderRepository } from "./repositories/order.repository";
import { sendMail } from "./services/email.service";

import { PORT } from "./configs/env.configs";

console.log("RAW process.env.PORT =", process.env.PORT);
console.log("PORT from config =", PORT);

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRouter);
app.use("/user", userRouter);

app.use("/categories", categoryRouter);
app.use("/properties", propertyCatalogRouter);

app.use("/tenant/properties", propertyManagementRouter);
app.use("/tenant/rooms", roomManagementRouter);

app.use("/locations", locationRouter);

//orders routes
app.use("/orders", orderRouter);

//error Middlewares
app.use(errorMiddleware);

// Start the server
console.log("MAU LISTEN...");

app.get("/", (req, res) => {
  res.json({
    message: "Property Rental API is running",
    endpoints: {
      auth: "/auth",
      users: "/user",
      properties: "/properties",
      tenant: "/tenant/properties",
    },
  });
});

app.listen(PORT, () => {
  console.log("SERVER RUNNING ON", PORT);
});

// cancel expired orders every 5 minutes
setInterval(
  async () => {
    try {
      await orderRepository.cancelExpiredOrders();
      console.log("Checked for expired orders");
    } catch (error) {
      console.error("Error cancelling expired orders:", error);
    }
  },
  5 * 60 * 1000,
); // every 5 minutes

// run once at startup
orderRepository.cancelExpiredOrders().then((result) => {
  console.log("Initial expired orders check completed");
});

//run daily reminder for H-1 check-in
setInterval(
  async () => {
    try {
      const now = new Date();
      if (now.getHours() === 8) {
        // 8 AM daily
        await orderRepository.sendH1Reminders();
        console.log("✅ H-1 reminders sent");
      }
    } catch (error) {
      console.error("Error sending reminders:", error);
    }
  },
  60 * 60 * 1000,
); // check every hour
