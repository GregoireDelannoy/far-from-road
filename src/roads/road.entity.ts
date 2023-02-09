import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roads')
export class Road {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  way_id: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'LineString',
    srid: 3857, // Projection code
  })
  geom;
}
