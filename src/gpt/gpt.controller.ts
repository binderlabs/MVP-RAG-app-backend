import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { GptService } from './gpt.service';
import { MessageDTO } from './dtos';

@Controller('gpt')
export class GptController {
  constructor(private readonly gptService: GptService) {}

  @Post('message')
  messageGpt(@Body() messageDto: MessageDTO) {
    return this.gptService.messageCheck(messageDto);
  }

  @Post('compare')
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      storage: diskStorage({
        destination: './uploads', // Carpeta donde se guardarán los archivos
        filename: (req, file, cb) => {
          const filename = `${Date.now()}-${file.originalname}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf)$/)) {
          return cb(new Error('Only PDF files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async compareWithPrompt(
    @Body('messageDto') messageDto: string, // Para acceder al mensaje en el cuerpo de la solicitud
    @UploadedFiles() files: Express.Multer.File[], // Para obtener los PDFs
  ) {
    const message = JSON.parse(messageDto);

    const filenames = files.map((file) => file.filename); // Obtener los nombres de los archivos

    return this.gptService.comparePrompt(message, filenames);
  }
}
