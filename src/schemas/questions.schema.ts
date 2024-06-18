import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuestionsDocument = HydratedDocument<Question>;

@Schema()
export class Question {
  @Prop()
  question: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
