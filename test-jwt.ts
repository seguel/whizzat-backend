import jwt from 'jsonwebtoken';

const secret =
  '4b89ae9b450a1361591aeb2b651cd86c0bc011f5d76cffaf5f309452241ec0ee62259647e128b058f191d214eba3f3716f05547c76537aa6ff73cd05dfc3f726'; // sua JWT_SECRET atual

const payload = {
  sub: 7,
  email: 'ariel.alejandrocs@gmail.com',
  nome: 'Ariel Alejandro Campillay Seguel',
  perfil: 1,
  lang: 'pt',
};

const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log('Token gerado:', token);
