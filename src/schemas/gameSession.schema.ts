import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class GameSession {
  @Prop({ required: true, type: Types.ObjectId })
  player1: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId })
  player2: Types.ObjectId;

  @Prop({ default: 0 })
  player1Score: number;

  @Prop({ default: 0 })
  player2Score: number;

  @Prop({ default: false })
  isGameOver: boolean;
}

export type GameSessionDocument = GameSession & Document;
export const GameSessionSchema = SchemaFactory.createForClass(GameSession);
