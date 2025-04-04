import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PARSE_PROMPT } from 'src/constants/prompts'

import { LocationService } from './location.service'
import OpenAI from 'openai'

@Injectable()
export class AiParserService {
  private openai: OpenAI

  constructor(
    private configService: ConfigService,
    private locationService: LocationService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('openai.api_key'),
    })
  }

  async parseMessage(message: string) {
    try {
      const cleaned_message = message
        .replace(/\n+/g, '\n')
        .replace(/[^\S\n]+/g, ' ')
        .trim()

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a specialized cargo transport message parser. Extract all relevant information and format it according to the schema. Be thorough in analyzing locations, prices, and cargo details.',
          },
          { role: 'user', content: PARSE_PROMPT + cleaned_message },
        ],
        temperature: 0.3,
      })

      const response = completion.choices[0]?.message?.content

      if (!response) {
        throw new NotFoundException('No response from OpenAI')
      }

      try {
        const parsed_data = JSON.parse(response)

        // Process each point to get coordinates
        if (parsed_data.points && Array.isArray(parsed_data.points)) {
          for (let i = 0; i < parsed_data.points.length; i++) {
            const point = parsed_data.points[i]
            if (point.location_name) {
              const suggestions =
                await this.locationService.getLocationSuggestions(
                  point.location_name,
                )
              if (suggestions && suggestions.length > 0) {
                const best_match = suggestions[0] // Get the first (best) match
                parsed_data.points[i].latitude = best_match.lat
                parsed_data.points[i].longitude = best_match.lon
                parsed_data.points[i].location_id = best_match.id
                // Update the location name to the normalized version
                parsed_data.points[i].location_name = best_match.name
              }
            }
          }
        }

        // Set default values for required fields if they're null
        if (!parsed_data.price_currency_id) parsed_data.price_currency_id = 4
        if (!parsed_data.rate_type) parsed_data.rate_type = 1
        if (!parsed_data.type_day) parsed_data.type_day = 1
        if (!parsed_data.when_type) parsed_data.when_type = 1

        // Ensure points have required cargo information
        if (parsed_data.points) {
          parsed_data.points = parsed_data.points.map((point) => ({
            ...point,
            cargos: point.cargos || [
              {
                cargo_volume: null,
                cargo_weight: null,
                cargo_weight_type: 1,
                type_cargo_id: null,
              },
            ],
          }))
        }
        console.log('cleaned message:', cleaned_message)

        console.log('AI response:', JSON.stringify(parsed_data, null, 2))
        return parsed_data
      } catch (error) {
        console.error('Parse error:', error)
        throw new InternalServerErrorException('Failed to parse message')
      }
    } catch (error) {
      console.error('Service error:', error)
      throw new InternalServerErrorException('Failed to parse message')
    }
  }
}
