import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { questionsDto } from './dtos/questions.dto';
import { Question } from 'src/schemas/questions.schema';
import { Model } from 'mongoose';
import { Option } from 'src/schemas/options.schema';
import { getApiResponse } from 'src/utils';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(Question.name) private questionsModel: Model<Question>,
    @InjectModel(Option.name) private optionsModel: Model<Option>,
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
}
