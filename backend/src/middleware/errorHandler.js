export function notFoundHandler(req, res) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {})
  });
}
