const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path });

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'خطأ داخلي في الخادم' : err.message,
  });
};

module.exports = { errorHandler };
