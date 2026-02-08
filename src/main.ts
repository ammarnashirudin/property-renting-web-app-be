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
//error Middlewares
app.use(errorMiddleware);


// Start the server
console.log("MAU LISTEN...");

app.listen(PORT, () => {
  console.log("SERVER RUNNING ON", PORT);
});




