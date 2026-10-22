const { body, validationResult } = require('express-validator');

// Validation middleware for user registration
const validateRegistration = [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('mobile').optional().isLength({ min: 8 }).withMessage('Mobile number must be at least 8 characters long'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next(); // Proceed to next middleware if validation passes
  }
];

module.exports = { validateRegistration };
