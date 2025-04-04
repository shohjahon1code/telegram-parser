import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import * as fs from 'fs'
import { Model } from 'mongoose'
import { createInterface } from 'readline'

import { Load, LoadDocument } from '../models/load.schema'
import { AiParserService } from './ai-parser.service'
import { TelegramClient } from 'telegram'
import { FloodWaitError } from 'telegram/errors'
import { NewMessage, NewMessageEvent } from 'telegram/events'
import { StringSession } from 'telegram/sessions'
import { Api } from 'telegram/tl'

@Injectable()
export class TelegramParserService implements OnModuleInit {
  private client: TelegramClient
  private stringSession: StringSession
  private readonly logger = new Logger(TelegramParserService.name)
  private isReconnecting = false
  private reconnectTimeout: NodeJS.Timeout | null = null
  private readonly sessionFile = 'telegram.session'
  private messageQueue: { message: string; timestamp: number }[] = []
  private readonly MESSAGE_RATE_LIMIT = 20
  private readonly MESSAGE_WINDOW = 60000

  constructor(
    @InjectModel(Load.name) private loadModel: Model<LoadDocument>,
    private configService: ConfigService,
    private aiParserService: AiParserService,
  ) {
    const session_data = this.loadSession()
    this.stringSession = new StringSession(session_data || '')
  }

  private loadSession(): string | null {
    try {
      if (fs.existsSync(this.sessionFile)) {
        return fs.readFileSync(this.sessionFile, 'utf8')
      }
    } catch (error) {
      this.logger.error('Error loading session:', error)
    }
    return null
  }

  private saveSession() {
    try {
      if (this.stringSession) {
        const session_string = this.stringSession.save()
        fs.writeFileSync(this.sessionFile, session_string)
        this.logger.log('Session saved successfully')
      }
    } catch (error) {
      this.logger.error('Error saving session:', error)
    }
  }

  async onModuleInit() {
    await this.initializeTelegramClient()
  }

  private async initializeTelegramClient() {
    try {
      const api_id = parseInt(
        this.configService.get<string>('telegram.api_id'),
        10,
      )
      const api_hash = this.configService.get<string>('telegram.api_hash')

      this.client = new TelegramClient(this.stringSession, api_id, api_hash, {
        connectionRetries: 5,
        useWSS: true,
        maxConcurrentDownloads: 1,
      })

      await this.connect()
      this.saveSession()
    } catch (error) {
      if (error instanceof FloodWaitError) {
        const wait_seconds = error.seconds
        this.logger.warn(`FloodWaitError: Need to wait ${wait_seconds} seconds`)

        if (!this.isReconnecting) {
          this.isReconnecting = true
          this.scheduleReconnect(wait_seconds * 1000)
        }
      } else {
        this.logger.error('Failed to initialize Telegram client:', error)
        throw error
      }
    }
  }

  private canProcessMessage(): boolean {
    const now = Date.now()
    this.messageQueue = this.messageQueue.filter(
      (item) => now - item.timestamp < this.MESSAGE_WINDOW,
    )
    return this.messageQueue.length < this.MESSAGE_RATE_LIMIT
  }

  private addMessageToQueue(message: string) {
    this.messageQueue.push({
      message,
      timestamp: Date.now(),
    })
  }

  private scheduleReconnect(delay: number) {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    this.logger.log(
      `Scheduling reconnection in ${Math.floor(delay / 1000)} seconds`,
    )

    this.reconnectTimeout = setTimeout(async () => {
      this.logger.log('Attempting to reconnect...')
      this.isReconnecting = false
      await this.initializeTelegramClient()
    }, delay)
  }

  private async connect() {
    try {
      await this.client.start({
        phoneNumber: this.configService.get<string>('telegram.phone_number'),
        password: async () => {
          const password = this.configService.get<string>('telegram.password')
          if (!password) {
            this.logger.log('No 2FA password required')
            return ''
          }
          return password
        },
        phoneCode: async () => await this.getAuthCode(),
        onError: async (err) => {
          if (
            err.message.includes('PASSWORD_HASH_INVALID') ||
            err.message.includes('Password is empty')
          ) {
            return false
          }
          return false
        },
      })

      this.saveSession()
      await this.startListening()
    } catch (error) {
      this.logger.error('Failed to connect:', error)
      if (
        error.message.includes('PASSWORD_HASH_INVALID') ||
        error.message.includes('Password is empty')
      ) {
        this.logger.error(
          'Authentication failed. Please check your credentials.',
        )
      }
      throw error
    }
  }

  private async getAuthCode(): Promise<string> {
    return new Promise((resolve) => {
      const readline = createInterface({
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
    try {
      this.client.addEventHandler(async (event: NewMessageEvent) => {
        try {
          if (!this.canProcessMessage()) {
            this.logger.warn('Rate limit reached, skipping message')
            return
          }

          const message = event.message.message
          this.addMessageToQueue(message)

          const parsed_load = await this.aiParserService.parseMessage(message)
          console.log(parsed_load)

          const load = await this.loadModel.insertMany(parsed_load)

          this.logger.log('Parsed and saved load:', load)
        } catch (error) {
          this.logger.error('Error processing message:', error)
        }
      }, new NewMessage({}))

      const channel_username = this.configService.get<string>(
        'telegram.channel_username',
      )

      await new Promise((resolve) => setTimeout(resolve, 2000))

      const entity = await this.client.getEntity(channel_username)
      await this.client.invoke(
        new Api.channels.JoinChannel({
          channel: entity,
        }),
      )

      this.logger.log('Successfully joined channel:', channel_username)
      this.logger.log('Started listening for new messages')
    } catch (error) {
      this.logger.error('Error in message listener:', error)
    }
  }
}
