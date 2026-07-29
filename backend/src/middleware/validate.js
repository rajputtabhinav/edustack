import { AppError } from "../utils/AppError.js";

export function validateBody(requiredFields) {
  return function validator(req, res, next) {
    for (const field of requiredFields) {
      const value = req.body[field];

      if (value === undefined || value === null || value === "") {
        return next(new AppError(`${field} is required`, 422));
      }
    }

    next();
  };
}
