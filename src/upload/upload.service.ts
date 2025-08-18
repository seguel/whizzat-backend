import { Injectable } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private uploadPath = join(__dirname, '..', '..', 'uploads');

  saveFile(file: Express.Multer.File): string {
    // garante que a pasta existe
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath);
    }

    const filePath = join(this.uploadPath, file.originalname);
    fs.writeFileSync(filePath, file.buffer);
    return file.originalname; // retorna o nome do arquivo
  }
}
