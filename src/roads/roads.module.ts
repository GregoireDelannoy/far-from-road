import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoadController } from './road.controller';
import { Road } from './road.entity';
import { RoadService } from './road.service';

@Module({
  imports: [TypeOrmModule.forFeature([Road])],
  controllers: [RoadController],
  providers: [RoadService],
})
export class RoadsModule {}
