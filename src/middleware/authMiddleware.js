import jwt from 'jsonwebtoken';
import { userModel } from '../models/userModel.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token is required' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Verify user still exists and is active
    const user = userModel.findByUsername(decoded.username);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        error: 'User account is not active' 
      });
    }
    
    req.userDetails = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        success: false, 
        error: 'Token expired' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

export default authenticateToken;
