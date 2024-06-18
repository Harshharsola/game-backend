import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Round {
  @Prop({ required: true, type: Types.ObjectId })
  sessionId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId })
  playerId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Question' })
  questionId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Option' })
  optionId: Types.ObjectId;

  @Prop()
  isCorrect: boolean;
}

export const RoundSchema = SchemaFactory.createForClass(Round);
