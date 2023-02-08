import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class GetWatersDto {
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  longMin: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  longMax: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  latMin: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  latMax: number;
}
