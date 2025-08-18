import { Injectable } from '@nestjs/common';
import { Express } from 'express'; // <- importante para tipagem
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  saveFile(file: Express.Multer.File): string {
    const uploadDir = './uploads';

    // cria a pasta se não existir
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // salva o arquivo no diretório
    const filePath = join(uploadDir, file.originalname);
    writeFileSync(filePath, file.buffer);

    return `Arquivo salvo em: ${filePath}`;
  }
}
