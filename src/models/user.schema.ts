import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

import { AUTH_METHODS, AuthMethod } from './otp.schema'

export type UserDocument = HydratedDocument<User>

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop()
  phone_number?: string

  @Prop()
  email?: string

  @Prop({ type: String, enum: AUTH_METHODS })
  auth_method: AuthMethod = 'phone-number'

  @Prop({ default: false })
  is_deleted?: boolean

  @Prop()
  deleted_at?: Date
}

export const UserSchema = SchemaFactory.createForClass(User)
UserSchema.index({ is_deleted: 1 })
