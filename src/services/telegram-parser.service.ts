import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { Load, LoadDocument } from '../models/load.schema'
import { AiParserService } from './ai-parser.service'
import { TelegramClient } from 'telegram'
import { NewMessage, NewMessageEvent } from 'telegram/events'
import { StringSession } from 'telegram/sessions'
import { Api } from 'telegram/tl'

@Injectable()
export class TelegramParserService implements OnModuleInit {
  private client: TelegramClient
  private stringSession: StringSession

  constructor(
    @InjectModel(Load.name) private loadModel: Model<LoadDocument>,
    private configService: ConfigService,
    private aiParserService: AiParserService,
  ) {
    this.stringSession = new StringSession('')
  }

  async onModuleInit() {
    await this.initializeTelegramClient()
    await this.startListening()
  }

  private async initializeTelegramClient() {
    const apiId = this.configService.get<number>('telegram.api_id')
    const apiHash = this.configService.get<string>('telegram.api_hash')

    this.client = new TelegramClient(this.stringSession, apiId, apiHash, {
      connectionRetries: 5,
    })

    await this.client.start({
      phoneNumber: this.configService.get<string>('telegram.phone_number'),
      password: async () => this.configService.get<string>('telegram.password'),
      phoneCode: async () => await this.getAuthCode(),
      onError: (err) => console.log(err),
    })
  }

  private async getAuthCode(): Promise<string> {
    return new Promise((resolve) => {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      })

      readline.question('Please enter the authentication code: ', (code) => {
        readline.close()
        resolve(code)
      })
    })
  }

  private async startListening() {
    const channelUsername = this.configService.get<string>(
      'telegram.channel_username',
    )

    this.client.addEventHandler(async (event: NewMessageEvent) => {
      const message = event.message

      if (message && message.peerId['channelId']) {
        try {
          const parsedLoad = await this.aiParserService.parseMessage(
            message.text,
          )

          if (parsedLoad) {
            const newLoad = new this.loadModel(parsedLoad)
            await newLoad.save()
            console.log('Successfully parsed and saved load:', newLoad._id)
          }
        } catch (error) {
          console.error('Error processing message:', error)
        }
      }
    }, new NewMessage({}))

    try {
      const entity = await this.client.getEntity(channelUsername)
      await this.client.invoke(
        new Api.channels.JoinChannel({
          channel: entity,
        }),
      )
      console.log('Successfully joined channel:', channelUsername)
    } catch (error) {
      console.error('Error joining channel:', error)
    }
  }
}
