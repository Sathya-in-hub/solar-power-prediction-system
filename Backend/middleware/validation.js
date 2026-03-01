const { body, validationResult } = require('express-validator');

const validateRegion = [
  body('region')
    .notEmpty()
    .withMessage('Region is required')
    .isString()
    .withMessage('Region must be a string')
    .trim()
    .escape(),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be valid')
    .toDate()
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateRegion,
  handleValidationErrors
};