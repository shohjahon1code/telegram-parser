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
      // baseURL: 'https://api.deepseek.com',
    })
  }

  private validateLoad(load: any): boolean {
    console.log('Validating load:', JSON.stringify(load, null, 2))

    // Check if points array exists and has exactly 2 points
    if (
      !load.points ||
      !Array.isArray(load.points) ||
      load.points.length !== 2
    ) {
      console.log('Failed points array validation')
      return false
    }

    // Check if both points have location names
    if (!load.points[0]?.location_name || !load.points[1]?.location_name) {
      console.log('Failed location names validation')
      return false
    }

    // Ensure points have proper cargos arrays
    load.points[0].cargos = Array.isArray(load.points[0].cargos)
      ? load.points[0].cargos
      : []
    load.points[1].cargos = []

    // Check if first point has valid cargos array with at least one item
    if (load.points[0].cargos.length === 0) {
      load.points[0].cargos = [
        {
          cargo_volume: null,
          cargo_weight: null,
          cargo_weight_type: 1,
          type_cargo_id: 1,
        },
      ]
    }

    // Validate type_body_id is one of the allowed values
    if (load.type_body_id && ![2, 3, 4].includes(load.type_body_id)) {
      console.log('Failed type_body_id validation')
      return false
    }

    // Ensure all required fields are present
    load.price_currency_id = load.price_currency_id || 4
    load.rate_type = load.rate_type || 1
    load.type_day = load.type_day || 1
    load.when_type = load.when_type || 1

    console.log('Load validation passed')
    return true
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
      console.log('ai response', response)

      if (!response) {
        throw new NotFoundException('No response from OpenAI')
      }

      try {
        let parsed_data = JSON.parse(response)

        // Handle both single object and array responses
        if (!Array.isArray(parsed_data)) {
          parsed_data = [parsed_data]
        }

        // Process each load
        const processed_loads = await Promise.all(
          parsed_data.map(async (load) => {
            // Process each point to get coordinates
            if (load.points && Array.isArray(load.points)) {
              for (let i = 0; i < load.points.length; i++) {
                const point = load.points[i]
                if (point.location_name) {
                  const suggestions =
                    await this.locationService.getLocationSuggestions(
                      point.location_name,
                    )
                  if (suggestions && suggestions.length > 0) {
                    const best_match = suggestions[0]
                    load.points[i].latitude = best_match.lat
                    load.points[i].longitude = best_match.lon
                    load.points[i].location_id = best_match.id
                    load.points[i].location_name = best_match.name
                  }
                }

                // Ensure correct cargos structure for each point
                if (i === 0) {
                  // First point should have cargos array with at least one item
                  load.points[i].cargos = point.cargos?.length
                    ? point.cargos
                    : [
                        {
                          cargo_volume: null,
                          cargo_weight: null,
                          cargo_weight_type: 1,
                          type_cargo_id: 1,
                        },
                      ]
                } else {
                  // Second point should have empty cargos array
                  load.points[i].cargos = []
                }

                // Ensure fixed time values
                load.points[i].time_start = '09:00:00'
                load.points[i].time_end = '18:00:00'
              }
            }

            // Set default values for required fields if they're null
            return {
              ...load,
              price_currency_id: load.price_currency_id || 4,
              rate_type: load.rate_type || 1,
              type_day: load.type_day || 1,
              when_type: load.when_type || 1,
              when_date:
                load.when_date || new Date().toISOString().split('T')[0],
              price_notes: {
                cargo: load.price_notes?.cargo || '',
                phone: load.price_notes?.phone || '',
                notes: load.price_notes?.notes || '',
              },
              points: load.points || [
                {
                  location_name: null,
                  latitude: null,
                  longitude: null,
                  location_id: null,
                  time_start: '09:00:00',
                  time_end: '18:00:00',
                  type: 1,
                  cargos: [
                    {
                      cargo_volume: null,
                      cargo_weight: null,
                      cargo_weight_type: 1,
                      type_cargo_id: 1,
                    },
                  ],
                },
                {
                  location_name: null,
                  latitude: null,
                  longitude: null,
                  location_id: null,
                  time_start: '09:00:00',
                  time_end: '18:00:00',
                  type: 2,
                  cargos: [],
                },
              ],
            }
          }),
        )

        // Filter out invalid loads
        const valid_loads = processed_loads.filter((load) =>
          this.validateLoad(load),
        )

        if (valid_loads.length === 0) {
          throw new NotFoundException(
            'No valid cargo loads found in the message',
          )
        }

        console.log('cleaned message:', cleaned_message)
        console.log('AI response:', JSON.stringify(valid_loads, null, 2))

        return valid_loads
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
