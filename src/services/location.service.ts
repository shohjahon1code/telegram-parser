import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

interface LocationIQResponse {
  place_id: string
  licence: string
  lat: string
  lon: string
  display_name: string
  boundingbox: string[]
}

@Injectable()
export class LocationService {
  private readonly locationIqApiKey: string
  private readonly baseUrl = 'https://us1.locationiq.com/v1'

  constructor(private configService: ConfigService) {
    this.locationIqApiKey = this.configService.get<string>('locationiq.api_key')
  }

  async getCoordinates(
    location_name: string,
  ): Promise<{ lat: number; lon: number } | null> {
    try {
      if (!location_name) {
        console.error('Location name is empty')
        return null
      }

      const cleaned_location = location_name.trim()
      const encoded_location = encodeURIComponent(cleaned_location)

      const response = await axios.get<LocationIQResponse[]>(
        `${this.baseUrl}/search`,
        {
          params: {
            key: this.locationIqApiKey,
            q: encoded_location,
            format: 'json',
            limit: 1,
            addressdetails: 1,
            'accept-language': 'ru,en',
          },
          headers: {
            'Accept-Language': 'ru,en',
          },
        },
      )

      console.log('LocationIQ response:', response.data)

      if (response.data && response.data.length > 0) {
        const location = response.data[0]
        return {
          lat: parseFloat(location.lat),
          lon: parseFloat(location.lon),
        }
      }

      console.warn(`No coordinates found for location: ${location_name}`)
      return null
    } catch (error) {
      console.error('Error getting coordinates:', error.message)
      if (axios.isAxiosError(error)) {
        console.error('API Error details:', error.response?.data)
      }
      return null
    }
  }
}
