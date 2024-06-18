import { Body, Controller, Post, Res } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private gameService: GameService) {}

  @Post('add-questions')
  async setQuestions(@Body() payload, @Res() res) {
    const response = await this.gameService.setQuestions(payload);
    res.send(response);
    return;
  }
}
