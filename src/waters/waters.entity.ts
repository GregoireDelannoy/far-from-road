import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('waters')
export class Waters {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 3857, // Projection code
  })
  geom;
}
