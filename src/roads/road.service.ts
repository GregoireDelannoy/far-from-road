import { Injectable } from '@nestjs/common';
import { Raw } from 'typeorm';
import { GetRoadsDto } from './GetRoads.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Road } from './road.entity';

@Injectable()
export class RoadService {
  constructor(
    @InjectRepository(Road)
    private readonly roadsRepository: Repository<Road>,
  ) {}

  async getRoads(params: GetRoadsDto): Promise<object> {
    return await this.roadsRepository.findBy({
      geom: Raw(
        (alias) =>
          `ST_Intersects(ST_Transform(ST_MakeEnvelope(:longMin, :latMin, :longMax, :latMax, 4326),3857), ${alias})`,
        params,
      ),
    });
  }
}
