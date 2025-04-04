import { Controller, Post } from '@nestjs/common'

import { LoadService } from '../services/load.service'

@Controller('loads')
export class LoadController {
  constructor(private readonly load_service: LoadService) {}

  @Post('post-to-flexobo')
  async post_all_loads_to_flexobo() {
    return await this.load_service.post_all_loads_to_flexobo()
  }

  @Post('delete-from-flexobo')
  async delete_loads_from_flexobo() {
    return await this.load_service.delete_loads_from_flexobo()
  }
}
