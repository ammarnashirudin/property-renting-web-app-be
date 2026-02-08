import "express";
import { User } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: number;
      role: "TENANT" | "USER";
    }
  }
}



declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}


export {};