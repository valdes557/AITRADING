const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Account has been suspended' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

const planRequired = (...plans) => {
  return (req, res, next) => {
    if (!plans.includes(req.user.plan)) {
      return res.status(403).json({
        message: `This feature requires ${plans.join(' or ')} plan`,
        requiredPlan: plans,
      });
    }
    if (req.user.plan !== 'free' && !req.user.isPlanActive()) {
      return res.status(403).json({
        message: 'Your subscription has expired',
        expired: true,
      });
    }
    next();
  };
};

module.exports = { protect, adminOnly, planRequired };
