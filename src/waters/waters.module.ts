import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatersController } from './waters.controller';
import { Waters } from './waters.entity';
import { WatersService } from './waters.service';

@Module({
  imports: [TypeOrmModule.forFeature([Waters])],
  controllers: [WatersController],
  providers: [WatersService],
})
export class WatersModule {}
