import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/auth/ws-jwt.guard';

@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayInit, OnGatewayDisconnect {
  private waitingPlayers = {};

  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(GameGateway.name);
  constructor(private readonly gameService: GameService) {}

  afterInit() {
    this.logger.log('Initialized');
  }

  handleConnection(client: any, ...args: any[]) {
    const { sockets } = this.server.sockets;

    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);
  }
  // @UseGuards(WsJwtGuard)
  @SubscribeMessage('game:join')
  async handleGameJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(data);
    // data = JSON.parse(data);
    const { userId } = data;
    this.waitingPlayers[userId] = client.id;
    const session = await this.gameService.findOrCreateGameSession(userId);
    this.logger.debug('hi from websocket');
    if (session) {
      client.join(session._id.toString());
      const round1 = await this.gameService.getQuestionByIndex(0);
      this.server
        .to(this.waitingPlayers[session.player1.toString()])
        .emit('game:init', { sessionId: session._id, question: round1 });
      this.server
        .to(this.waitingPlayers[session.player2.toString()])
        .emit('game:init', { sessionId: session._id, question: round1 });
    } else {
      client.emit('game:waiting');
    }
  }

  // @UseGuards(WsJwtGuard)
  @SubscribeMessage('answer:submit')
  async handleAnswerSubmit(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(data);
    this.logger.debug(this.waitingPlayers[data.playerId]);
    const result = await this.gameService.submitAnswer(data);
    if (result.isGameOver) {
      this.server
        .to(this.waitingPlayers[result.player1Id])
        .emit('game:end', result);
      this.server
        .to(this.waitingPlayers[result.player2Id])
        .emit('game:end', result);
    } else {
      this.server
        .to(this.waitingPlayers[data.playerId])
        .emit('question:send', result);
      // this.server
      //   .to(this.waitingPlayers[result.player1Id])
      //   .emit('question:send', result);
    }
  }

  handleDisconnect(client: any) {
    const clientIds = Object.keys(this.waitingPlayers);
    clientIds.forEach((key) => {
      if (this.waitingPlayers[key] === client.id) {
        this.gameService.removePlayerFromWaitList(key);
        delete this.waitingPlayers[key];
      }
    });
    this.logger.log(`Cliend id:${client.id} disconnected`);
  }
}
