import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP')

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl: original_url } = request
    const user_agent = request.get('user-agent') || ''

    response.on('finish', () => {
      const { statusCode: status_code } = response
      const content_length = response.get('content-length')

      this.logger.log(
        `${method} ${original_url} ${status_code} ${content_length} - ${user_agent} ${ip}`,
      )
    })

    next()
  }
}
