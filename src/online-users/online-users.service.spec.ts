import { Test, TestingModule } from '@nestjs/testing';
import { OnlineUsersService } from './online-users.service';

describe('OnlineUsersService', () => {
  let service: OnlineUsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnlineUsersService],
    }).compile();

    service = module.get<OnlineUsersService>(OnlineUsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
