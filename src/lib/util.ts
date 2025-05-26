import * as jwt from 'jsonwebtoken';

export const generateActivationToken = (userId: number): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_ACTIVATE_SECRET || 'activate_secret',
    { expiresIn: '1d' },
  );
};
