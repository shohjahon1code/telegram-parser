import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type LoadDocument = HydratedDocument<Load>

@Schema()
export class Cargo {
  @Prop({ required: true, type: Number })
  cargo_volume: number

  @Prop({ required: true, type: Number })
  cargo_weight: number

  @Prop({ required: true, type: Number })
  cargo_weight_type: number

  @Prop({ required: true, type: Number })
  type_cargo_id: number
}

@Schema()
export class Point {
  @Prop({ type: [Cargo], default: null })
  cargos: Cargo[] | null

  @Prop({ required: true, type: Number })
  latitude: number

  @Prop({ required: true, type: Number })
  longitude: number

  @Prop({ required: true, type: String })
  location_id: string

  @Prop({ required: true, type: String })
  time_end: string

  @Prop({ required: true, type: String })
  time_start: string

  @Prop({ required: true, type: Number })
  type: number
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Load {
  @Prop({ required: true, type: Number })
  price: number

  @Prop({ required: true, type: String })
  when_date: string

  @Prop({ required: true, type: Number })
  price_currency_id: number

  @Prop({ required: true, type: Number })
  rate_type: number

  @Prop({ required: true, type: Number })
  type_day: number

  @Prop({ required: true, type: Number })
  when_type: number

  @Prop({ required: true, type: Number })
  type_body_id: number

  @Prop({ type: [Point], required: true })
  points: Point[]
}

export const LoadSchema = SchemaFactory.createForClass(Load)
