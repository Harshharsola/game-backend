import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type OptionsDocument = HydratedDocument<Option>;

@Schema()
export class Option {
  @Prop()
  optionText: string;

  @Prop()
  isCorrect: boolean;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  })
  questionId: string;
}

export const OptionSchema = SchemaFactory.createForClass(Option);
