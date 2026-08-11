/**
 * Validation Middleware for Store Service
 */

function validate(validatorFn) {
  return (req, res, next) => {
    const result = validatorFn(req.body);
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }
    next();
  };
}

module.exports = { validate };
