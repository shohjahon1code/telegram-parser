import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

import { LOCATION_NORMALIZATION_PROMPT } from '../constants/prompts'
import { GPTMessage, GPTResponse } from '../interfaces/gpt.interface'

@Injectable()
export class GPTService {
  private readonly logger = new Logger(GPTService.name)
  private readonly openaiApiKey: string
  private readonly baseUrl = 'https://api.openai.com/v1'

  constructor(private configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('openai.api_key')
  }

  private async makeGPTRequest(
    messages: GPTMessage[],
    temperature: number = 0.3,
    maxTokens: number = 1,
  ): Promise<string | null> {
    try {
      const response = await axios.post<GPTResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'gpt-4',
          messages,
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      )

      return response.data.choices[0].message.content.trim()
    } catch (error) {
      this.logger.error('Error making DeepSeek request:', error.message)
      if (axios.isAxiosError(error)) {
        this.logger.error('API Error details:', error.response?.data)
      }
      return null
    }
  }

  async normalizeLocationName(location: string): Promise<string> {
    try {
      const messages: GPTMessage[] = [
        {
          role: 'system',
          content: LOCATION_NORMALIZATION_PROMPT,
        },
        {
          role: 'user',
          content: location,
        },
      ]

      const normalized_name = await this.makeGPTRequest(messages)
      if (!normalized_name) {
        this.logger.warn(`Failed to normalize location name: ${location}`)
        return location
      }

      this.logger.log(`Normalized location: ${location} -> ${normalized_name}`)
      return normalized_name
    } catch (error) {
      this.logger.error('Error normalizing location name:', error.message)
      return location
    }
  }
}
