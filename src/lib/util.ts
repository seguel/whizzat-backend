import * as jwt from 'jsonwebtoken';

export const generateActivationToken = (userId: number): string => {
  return jwt.sign({ userId }, process.env.JWT_ACTIVATE_SECRET!, {
    expiresIn: '24h',
  });
};

export const generateResetTokenCurto = (userId: number): string => {
  return jwt.sign({ userId }, process.env.JWT_RESET_SECRET!, {
    expiresIn: '15m',
  });
};
