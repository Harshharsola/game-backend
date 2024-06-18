import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class GameGateway implements OnGatewayInit, OnGatewayConnection {
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
    this.logger.debug(typeof data);
    data = JSON.parse(data);
    const { userId } = data;
    const session = await this.gameService.findOrCreateGameSession(userId);
    this.logger.debug('hi from websocket');
    if (session) {
      client.join(session._id.toString());
      this.server
        .to(session.player1.toString())
        .emit('game:init', { sessionId: session._id });
      this.server
        .to(session.player2.toString())
        .emit('game:init', { sessionId: session._id });
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
    const result = await this.gameService.submitAnswer(data);
    if (result.isGameOver) {
      this.server.to(result.sessionId).emit('game:end', result);
    } else {
      this.server.to(result.sessionId).emit('question:send', result);
    }
  }
}
