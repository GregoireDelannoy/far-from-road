import { Controller, Get, Query } from '@nestjs/common';
import { GetRoadsDto } from './GetRoads.dto';
import { RoadService } from './road.service';

@Controller()
export class RoadController {
  constructor(private readonly roadService: RoadService) {}

  @Get('roads')
  async getRoads(@Query() params: GetRoadsDto): Promise<object> {
    return (await this.roadService.getRoads(params)).map(r => r.geom);
  }
}
