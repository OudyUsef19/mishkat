const { validationResult } = require('express-validator');
const { error } = require('../utils/response');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'بيانات غير صحيحة', 422, errors.array());
  }
  next();
};

module.exports = { validate };
