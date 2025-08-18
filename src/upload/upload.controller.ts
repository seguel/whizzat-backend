import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    const filename = this.uploadService.saveFile(file);

    // monta URL completa para o front
    //const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const fileUrl = `/uploads/${filename}`;
    return { filename, url: fileUrl };
  }
}
