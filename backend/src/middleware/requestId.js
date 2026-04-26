import { nanoid } from "nanoid";

export function requestId(req, res, next) {
  const incoming = req.header("x-request-id");
  req.id = incoming || nanoid(12);
  res.setHeader("x-request-id", req.id);
  next();
}
