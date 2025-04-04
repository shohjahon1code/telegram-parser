import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'

import configuration from './config'
import { LoadController } from './controllers/load.controller'
import { Load, LoadSchema } from './models/load.schema'
// import { AiParserService } from './services/ai-parser.service'
// import { GPTService } from './services/gpt.service'
import { LoadService } from './services/load.service'

// import { LocationService } from './services/location.service'
// import { TelegramParserService } from './services/telegram-parser.service'

@Module({
  imports: [
    ConfigModule.forRoot(configuration),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        uri: config.get('database.uri'),
        user: config.get('database.user'),
        pass: config.get('database.password'),
        dbName: config.get('database.name'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Load.name, schema: LoadSchema }]),
  ],
  controllers: [LoadController],
  providers: [
    // TelegramParserService,
    // AiParserService,
    // LocationService,
    // GPTService,
    LoadService,
  ],
})
export class AppModule {}
