import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { questionsDto } from './dtos/questions.dto';
import { Question } from 'src/schemas/questions.schema';
import { Model } from 'mongoose';
import { Option } from 'src/schemas/options.schema';
import { getApiResponse } from 'src/utils';
import { OnlineUsersService } from 'src/online-users/online-users.service';
import {
  GameSession,
  GameSessionDocument,
} from 'src/schemas/gameSession.schema';
import { Round } from 'src/schemas/round.schema';

@Injectable()
export class GameService {
  private waitingPlayers: string[] = [];

  constructor(
    @InjectModel(Question.name) private questionsModel: Model<Question>,
    @InjectModel(Option.name) private optionsModel: Model<Option>,
    @InjectModel(GameSession.name)
    private gameSessionModel: Model<GameSessionDocument>,
    @InjectModel(Round.name) private roundModel: Model<Round>,
  ) {}

  async setQuestions(payload: questionsDto) {
    try {
      const questionDocument = new this.questionsModel({
        question: payload.question,
      });
      await questionDocument.save();
      payload.options.map((option) => {
        const optionDocument = new this.optionsModel({
          questionId: questionDocument._id,
          ...option,
        });
        optionDocument.save();
      });
      return getApiResponse({}, '200', 'question added succesfully');
    } catch (error) {
      console.log(error);
      return getApiResponse({}, '500', 'internal server error');
    }
  }

  async findOrCreateGameSession(
    userId: string,
  ): Promise<GameSessionDocument | null> {
    const opponentId = this.waitingPlayers.shift();
    console.log(userId, opponentId);
    if (this.waitingPlayers.length > 0 && userId !== opponentId) {
      const newSession = new this.gameSessionModel({
        player1: userId,
        player2: opponentId,
      });
      return newSession.save();
    }

    userId !== opponentId && this.waitingPlayers.push(userId);
    return null;
  }

  async submitAnswer(data: any): Promise<any> {
    const { sessionId, playerId, questionId, optionId } = data;
    const session = await this.gameSessionModel.findById(sessionId).exec();
    const option = await this.optionsModel.findById(optionId).exec();

    if (!session || session.isGameOver || !option) {
      throw new Error('Invalid game session or option');
    }

    const isCorrect = option.isCorrect;
    const round = new this.roundModel({
      sessionId,
      playerId,
      questionId,
      optionId,
      isCorrect,
    });

    await round.save();

    if (isCorrect) {
      if (session.player1.toString() === playerId) {
        session.player1Score += 1;
      } else {
        session.player2Score += 1;
      }
    }

    const rounds = await this.roundModel.find({ sessionId }).exec();
    if (rounds.length >= 12) {
      // Assuming 6 questions per player
      session.isGameOver = true;
    }

    await session.save();

    return {
      sessionId: session._id,
      isGameOver: session.isGameOver,
      player1Score: session.player1Score,
      player2Score: session.player2Score,
    };
  }
}
