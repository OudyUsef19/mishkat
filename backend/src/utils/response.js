const success = (res, data = {}, message = 'success', status = 200) =>
  res.status(status).json({ success: true, message, data });

const error = (res, message = 'حدث خطأ', status = 500, errors = null) =>
  res.status(status).json({ success: false, message, ...(errors && { errors }) });

const paginate = (res, data, total, page, limit, message = 'success') =>
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  });

module.exports = { success, error, paginate };
