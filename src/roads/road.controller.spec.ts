import { Test, TestingModule } from '@nestjs/testing';
import { RoadController } from './road.controller';
import { RoadService } from './road.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database.module';

describe('RoadController', () => {
  let roadController: RoadController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
      controllers: [RoadController],
      providers: [RoadService],
    }).compile();

    roadController = app.get<RoadController>(RoadController);
  });

  describe('root', () => {
    it('should return "Hello World!"', async () => {
      expect(await roadController.getRoads()).toBe('Hello World!');
    });
  });
});
