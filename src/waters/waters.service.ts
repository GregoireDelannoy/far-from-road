import { Injectable } from '@nestjs/common';
import { Raw } from 'typeorm';
import { GetWatersDto } from './GetWaters.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Waters } from './waters.entity';

@Injectable()
export class WatersService {
  constructor(
    @InjectRepository(Waters)
    private readonly watersRepository: Repository<Waters>,
  ) {}

  async getWaters(params: GetWatersDto): Promise<Waters[]> {
    return await this.watersRepository.findBy({
      geom: Raw(
        (alias) =>
          `ST_Intersects(ST_Transform(ST_MakeEnvelope(:longMin, :latMin, :longMax, :latMax, 4326),3857), ${alias})`,
        params,
      ),
    });
  }
}
