import * as jwt from 'jsonwebtoken';

export const generateActivationToken = (userId: number): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_ACTIVATE_SECRET ||
      'a13e01e0d47957a7b225227a4f23e1d0ea1cb6fa5ffdc2750d853c4bd414b653173268026fedb1261b29d3050fa60247b9f0aea6502682bda65055c5c911890d',
    { expiresIn: '24h' },
  );
};

export const generateResetTokenCurto = (userId: number): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_RESET_SECRET ||
      'c2bcbdb91b615972af4dd66825176a3d1dc146383a5aa2d634a1306cfbff2b4299ff7bfa1d3b52fb01d217c8d489796b9e02814ca715919a3845268071473696',
    { expiresIn: '15m' },
  );
};
