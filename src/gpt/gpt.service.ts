import { Injectable } from '@nestjs/common';
import { MessageDTO } from './dtos';
import OpenAI from 'openai';
import langchainTest from './use-cases/langchainTest';
import compareFiles from './use-cases/compareFiles';

@Injectable()
export class GptService {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  async messageCheck(messageDto: MessageDTO) {
    return await langchainTest(messageDto.prompt);
  }

  async comparePrompt(messageDto: MessageDTO, filenames: string[]) {
    return await compareFiles(messageDto, filenames);
  }
}
