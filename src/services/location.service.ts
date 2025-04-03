import { Injectable } from '@nestjs/common'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

import {
  LocationIQAutocompleteResponse,
  LocationIQResponse,
} from 'src/interfaces/location.interface'

import { GPTService } from './gpt.service'

@Injectable()
export class LocationService {
  private readonly locationIqApiKey: string
  private readonly baseUrl = 'https://us1.locationiq.com/v1'
  private readonly logger = new Logger(LocationService.name)

  constructor(
    private configService: ConfigService,
    private gptService: GPTService,
  ) {
    this.locationIqApiKey = this.configService.get<string>('locationiq.api_key')
  }

  async getCoordinates(
    location_name: string,
  ): Promise<{ lat: number; lon: number; location_id: string } | null> {
    try {
      if (!location_name) {
        this.logger.error('Location name is empty')
        return null
      }

      // First normalize the location name using GPT
      const normalized_location =
        await this.gptService.normalizeLocationName(location_name)
      const encoded_location = encodeURIComponent(normalized_location)

      const response = await axios.get<LocationIQResponse[]>(
        `${this.baseUrl}/search`,
        {
          params: {
            key: this.locationIqApiKey,
            q: encoded_location,
            format: 'json',
            limit: 1,
            addressdetails: 1,
            'accept-language': 'en',
          },
          headers: {
            'Accept-Language': 'en',
          },
        },
      )

      this.logger.debug('LocationIQ response:', response.data)

      if (response.data && response.data.length > 0) {
        const location = response.data[0]
        return {
          lat: parseFloat(location.lat),
          lon: parseFloat(location.lon),
          location_id: `${location.osm_type[0].toUpperCase()}${location.osm_id}`,
        }
      }

      this.logger.warn(
        `No coordinates found for location: ${normalized_location} (original: ${location_name})`,
      )
      return null
    } catch (error) {
      this.logger.error('Error getting coordinates:', error.message)
      if (axios.isAxiosError(error)) {
        this.logger.error('API Error details:', error.response?.data)
      }
      return null
    }
  }

  async getLocationSuggestions(
    query: string,
    limit: number = 7,
  ): Promise<Array<{
    id: string
    name: string
    fullName: string
    lat: number
    lon: number
  }> | null> {
    try {
      if (!query) {
        this.logger.error('Query string is empty')
        return null
      }

      // First normalize the query using GPT
      const normalized_query =
        await this.gptService.normalizeLocationName(query)
      const encoded_query = encodeURIComponent(normalized_query)

      const response = await axios.get<LocationIQAutocompleteResponse[]>(
        `${this.baseUrl}/autocomplete`,
        {
          params: {
            key: this.locationIqApiKey,
            q: encoded_query,
            format: 'json',
            addressdetails: 1,
            limit,
            dedupe: 1,
            'accept-language': 'en',
            countrycodes: 'uz,kg,kz,ru',
          },
          headers: {
            'Accept-Language': 'en',
          },
        },
      )

      if (response.data && response.data.length > 0) {
        const suggestions = response.data.map((location) => ({
          id: `${location.osm_type[0].toUpperCase()}${location.osm_id}`,
          name: location.display_place || location.display_name.split(',')[0],
          fullName: location.display_name,
          lat: parseFloat(location.lat),
          lon: parseFloat(location.lon),
        }))

        this.logger.log(
          `Found ${suggestions.length} suggestions for "${query}" (normalized: "${normalized_query}")`,
        )
        return suggestions
      }

      this.logger.warn(
        `No suggestions found for query: ${normalized_query} (original: ${query})`,
      )
      return null
    } catch (error) {
      this.logger.error('Error getting location suggestions:', error.message)
      if (axios.isAxiosError(error)) {
        this.logger.error('API Error details:', error.response?.data)
      }
      return null
    }
  }
}
