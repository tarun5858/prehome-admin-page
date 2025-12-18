
import jwt from "jsonwebtoken";

const authRequired = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.username !== process.env.ADMIN_USER) {
        return res.status(403).json({ message: "Access denied: Not an admin" });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
export default authRequired;

