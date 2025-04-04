import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import axios from 'axios'
import { Model } from 'mongoose'

import { Load, LoadDocument } from '../models/load.schema'

@Injectable()
export class LoadService {
  private readonly logger = new Logger(LoadService.name)
  private readonly base_url = 'https://test-api.flexobo.com/api'
  private readonly token =
    '758|A0ixxT0iA8bUId7cDIPKCP3fJ93cn3qPt5btRwtY844f6a8f'

  constructor(
    @InjectModel(Load.name) private load_model: Model<LoadDocument>,
  ) {}

  private get_headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    }
  }

  async delete_loads_from_flexobo() {
    const results = []
    for (let id = 350; id <= 405; id++) {
      try {
        const response = await axios.delete(
          `${this.base_url}/delete-cargo/${797}`,
          {
            headers: this.get_headers(),
          },
        )
        console.log(response.data)

        results.push({ success: true, id, result: response.data })
        this.logger.log(`Successfully deleted cargo with ID ${id}`)
      } catch (error) {
        results.push({ success: false, id, error: error.message })
        this.logger.error(`Error deleting cargo with ID ${id}:`, error.message)
      }
    }
    return results
  }

  async get_all_loads() {
    try {
      return await this.load_model.find().exec()
    } catch (error) {
      this.logger.error('Error fetching loads:', error)
      throw error
    }
  }

  async post_load_to_flexobo(load: any) {
    try {
      const response = await axios.post(`${this.base_url}/create-cargo`, load, {
        headers: this.get_headers(),
      })
      this.logger.log(`Successfully posted load to Flexobo: ${response.data}`)
      return response.data
    } catch (error) {
      this.logger.error(
        'Error posting load to Flexobo:',
        error.response?.data || error.message,
      )
      throw error
    }
  }

  async post_all_loads_to_flexobo() {
    try {
      const loads: LoadDocument[] = await this.get_all_loads()
      this.logger.log(`Found ${loads.length} loads to post`)

      const results = []
      for (const load of loads) {
        try {
          const fixed_loads = {
            when_date: load.when_date,
            price: load.price,
            price_currency_id: load.price_currency_id,
            rate_type: load.price == null ? 3 : load.rate_type,
            type_day: load.type_day,
            when_type: load.when_type,
            type_body_id: load.type_body_id,
            price_notes: load.price_notes.phone,
            points: load.points,
          }
          const result = await this.post_load_to_flexobo(fixed_loads)
          results.push({ success: true, load_id: load._id, result })
        } catch (error) {
          results.push({
            success: false,
            load_id: load._id,
            error: error.message,
          })
        }
      }

      return {
        total: loads.length,
        results,
      }
    } catch (error) {
      this.logger.error('Error in posting all loads:', error)
      throw error
    }
  }
}
