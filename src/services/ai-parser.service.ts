import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import OpenAI from 'openai'

@Injectable()
export class AiParserService {
  private openai: OpenAI

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('openai.api_key'),
    })
  }

  async parseMessage(message: string) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that parses cargo transport messages into structured data. Always return valid JSON.',
          },
          { role: 'user', content: prompt + message },
        ],
        temperature: 0.3,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new NotFoundException('No response from OpenAI')
      }

      try {
        return JSON.parse(response)
      } catch (error) {
        throw new InternalServerErrorException('Failed to parse message')
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to parse message')
    }
  }
}
