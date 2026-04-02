export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.userDetails) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    const userRole = req.userDetails.role_name;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Insufficient permissions.' 
      });
    }
    
    next();
  };
};

export const requireAdmin = authorize('admin');

export const requireAdminOrAnalyst = authorize('admin', 'analyst');

export default authorize;
