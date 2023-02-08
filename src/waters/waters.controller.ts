import { Controller, Get, Query } from '@nestjs/common';
import { GetWatersDto } from './GetWaters.dto';
import { WatersService } from './waters.service';

@Controller()
export class WatersController {
  constructor(private readonly watersService: WatersService) {}

  @Get('waters')
  async getWaters(@Query() params: GetWatersDto): Promise<object> {
    return (await this.watersService.getWaters(params)).map(w => w.geom);
  }
}
