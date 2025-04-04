import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type LoadDocument = HydratedDocument<Load>

@Schema()
export class Cargo {
  @Prop({ type: Number })
  cargo_volume: number

  @Prop({ type: Number })
  cargo_weight: number

  @Prop({ type: Number })
  cargo_weight_type: number

  @Prop({ type: Number })
  type_cargo_id: number
}

@Schema()
export class Point {
  @Prop({ type: [Cargo], default: [] })
  cargos: Cargo[]

  @Prop({ type: Number })
  latitude: number

  @Prop({ type: Number })
  longitude: number

  @Prop({ type: String })
  location_id: string

  @Prop({ type: String })
  time_end: string

  @Prop({ type: String })
  time_start: string

  @Prop({ type: Number })
  type: number
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Load {
  @Prop({ type: Number })
  price: number

  @Prop({ type: String })
  when_date: string

  @Prop({ type: Number })
  price_currency_id: number

  @Prop({ type: Number })
  rate_type: number

  @Prop({ type: Number })
  type_day: number

  @Prop({ type: Number })
  when_type: number

  @Prop({ type: Number })
  type_body_id: number

  @Prop({ type: Object, default: {} })
  price_notes: Record<string, string>

  @Prop({ type: [Point] })
  points: Point[]
}

export const LoadSchema = SchemaFactory.createForClass(Load)
