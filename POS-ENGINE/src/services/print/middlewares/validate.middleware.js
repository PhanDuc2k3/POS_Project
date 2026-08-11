/**
 * Validate-middleware factory.
 */
module.exports = {
  validate(fn) {
    return (req, res, next) => {
      const { errors } = fn(req.body || {});
      if (errors && errors.length) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }
      next();
    };
  },
};
