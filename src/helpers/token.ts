import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { SECRET_KEY } from "../configs/env.configs";

export function generateToken(
  payload: object,
  expiresIn: SignOptions["expiresIn"]
) {
  return jwt.sign(payload, SECRET_KEY as Secret, { expiresIn });
}

