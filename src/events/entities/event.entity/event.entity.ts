import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

@Schema()
export class Event extends mongoose.Document {
  @Prop()
  type: string

  @Prop({ index: true })
  name: string

  @Prop({ type: mongoose.SchemaTypes.Mixed })
  payload: Record<string, any>
}

export const EventSchema = SchemaFactory.createForClass(Event)

EventSchema.index({ name: 1, type: -1 }) // 1 ascending order -1 descending order
