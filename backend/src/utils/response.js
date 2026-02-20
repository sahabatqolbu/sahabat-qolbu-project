// backend/src/utils/response.js

export const successResponse = (
  res,
  data = null,
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res,
  message = "Error",
  statusCode = 500,
  errors = null,
  code = null
) => {
  return res.status(statusCode).json({
    success: false,
    ...(code ? { code } : {}),
    message,
    errors,
  });
};

export const createdResponse = (res, data = null, message = "Created") => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

export const paginatedResponse = (
  res,
  data,
  pagination,
  message = "Data berhasil diambil"
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

export const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    code: "VALIDATION_FAILED",
    message: "Validasi gagal",
    errors,
  });
};

export const unauthorizedResponse = (
  res,
  message = "Unauthorized - Silakan login",
  code = "AUTH_UNAUTHORIZED"
) => {
  return res.status(401).json({
    success: false,
    code,
    message,
  });
};

export const forbiddenResponse = (
  res,
  message = "Akses ditolak",
  code = "AUTH_FORBIDDEN"
) => {
  return res.status(403).json({
    success: false,
    code,
    message,
  });
};

export const notFoundResponse = (
  res,
  message = "Data tidak ditemukan",
  code = "RESOURCE_NOT_FOUND"
) => {
  return res.status(404).json({
    success: false,
    code,
    message,
  });
};
