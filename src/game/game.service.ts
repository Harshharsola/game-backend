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
    console.log(this.waitingPlayers.length > 0, userId, this.waitingPlayers);
    if (
      this.waitingPlayers.length > 0 &&
      !this.waitingPlayers.includes(userId)
    ) {
      const opponentId = this.waitingPlayers.shift();
      console.log('creating game session');
      const gameSession = await this.gameSessionModel.find({
        player1: userId,
        player2: opponentId,
      });
      if (gameSession[0] && !gameSession[0].isGameOver) {
        return gameSession[0];
      }
      const newSession = new this.gameSessionModel({
        player1: userId,
        player2: opponentId,
      });
      return newSession.save();
    }

    !this.waitingPlayers.includes(userId) && this.waitingPlayers.push(userId);
    return null;
  }

  async getQuestionByIndex(index: number) {
    const question = await this.questionsModel.findOne().skip(index).lean();
    const optionsArray = await this.optionsModel
      .find({ questionId: question._id })
      .lean();
    return { question, optionsArray };
  }

  removePlayerFromWaitList(id) {
    this.waitingPlayers = this.waitingPlayers.filter((player) => player !== id);
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
    let player;
    if (playerId === session.player1.toString()) {
      player = 1;
    } else {
      player = 2;
    }
    if (isCorrect) {
      if (player === 1) {
        session.player1Score += 1;
      } else {
        session.player2Score += 1;
      }
    }

    const playerRounds = await this.roundModel
      .find({ sessionId, playerId })
      .exec();

    const otherPlayerRounds = await this.roundModel
      .find({
        sessionId,
        playerId: player === 1 ? session.player2 : session.player1,
      })
      .exec();
    let nextQuestion = null;
    if (playerRounds.length === 6 && otherPlayerRounds.length === 6) {
      // Assuming 6 questions per player
      session.isGameOver = true;
    } else if (playerRounds.length < 6) {
      nextQuestion = await this.getQuestionByIndex(playerRounds.length);
    }

    await session.save();

    return {
      sessionId: session._id,
      isGameOver: session.isGameOver,
      player1Id: session.player1,
      player2Id: session.player2,
      playerScore: player === 1 ? session.player1Score : session.player2Score,
      otherPlayerScore:
        player === 1 ? session.player2Score : session.player1Score,
      question: nextQuestion,
    };
  }
}
