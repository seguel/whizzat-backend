import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
//import { ValidationPipe } from '@nestjs/common';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import * as express from 'express';
import fs from 'fs';

import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
    /* new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }), */
  );
  app.useGlobalFilters(new I18nValidationExceptionFilter());
  app.enableCors({
    origin: process.env.FRONTEND_URL, // seu frontend Next.js
    credentials: true, // se for usar cookies
  });

  // Pega a raiz do projeto (process.cwd() funciona tanto local quanto no Render)
  const uploadsPath =
    process.env.UPLOADS_PATH || join(process.cwd(), 'uploads');

  // Garante que a pasta exista

  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  // Servir arquivos estáticos
  app.use('/uploads', express.static(uploadsPath));

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
