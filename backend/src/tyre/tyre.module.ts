import { Module } from '@nestjs/common';
import { TyreController } from './tyre.controller';
import { TyreService } from './tyre.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TyreController],
  providers: [TyreService],
  exports: [TyreService],
})
export class TyreModule {}
