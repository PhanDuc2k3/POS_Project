/**
 * Validation Middleware Factory
 * Takes a validator function and returns middleware.
 * If validation fails, returns 400 immediately.
 */

function validate(validatorFn) {
  return (req, res, next) => {
    const result = validatorFn(req.body);
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }
    // Attach validated/parsed data if any
    if (result.ext) req.validated = result;
    next();
  };
}

module.exports = { validate };
