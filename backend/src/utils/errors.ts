export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') { super(message, 404, 'NOT_FOUND'); }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Not authorized') { super(message, 401, 'UNAUTHORIZED'); }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super(message, 403, 'FORBIDDEN'); }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') { super(message, 409, 'CONFLICT'); }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') { super(message, 400, 'VALIDATION_ERROR'); }
}

export class PaymentRequiredError extends AppError {
  constructor(message = 'Payment required') { super(message, 402, 'PAYMENT_REQUIRED'); }
}
