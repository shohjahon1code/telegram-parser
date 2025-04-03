import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

import { OTP_EXPIRES_IN } from 'src/constants'

export type OTPDocument = HydratedDocument<OTP>

export const AUTH_METHODS = ['phone-number', 'email'] as const
export type AuthMethod = (typeof AUTH_METHODS)[number]

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class OTP {
  @Prop()
  code: number

  @Prop()
  code_hash: string

  @Prop()
  phone_number?: string

  @Prop()
  email?: string

  @Prop({ type: String, enum: AUTH_METHODS })
  auth_method: AuthMethod = 'phone-number'
}

export const OTPSchema = SchemaFactory.createForClass(OTP)

OTPSchema.index({ created_at: 1 }, { expireAfterSeconds: OTP_EXPIRES_IN })
