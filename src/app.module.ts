import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { RoadsModule } from './roads/roads.module';
import { WatersModule } from './waters/waters.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      renderPath: 'index.html',
    }),
    RoadsModule,
    WatersModule,
  ],
})
export class AppModule {}
