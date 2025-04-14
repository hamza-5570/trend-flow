import jwt from '../utilities/jwt.js';
import Response from '../utilities/response.js';

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract Bearer token

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: No Token Provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.userId = decoded._id; // Attach user ID to the request
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid Token' });
  }
};
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return Response.authorizationError(res, 'Access denied. Admins only.');
  }
  next();
};
const authenticateUser = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Access Denied. No Token Provided.' });
  }

  try {
    const decoded = jwt.verify(
      token.replace('Bearer ', ''),
      process.env.JWT_SECRET
    );
    req.user = decoded; // Attach user data to request
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};
export default {
  authenticateToken,
  authenticateUser,
  isAdmin,
};
