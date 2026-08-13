import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { DataScopeService } from '../auth/data-scope.service';

@Module({
  controllers: [AlertController],
  providers: [AlertService, DataScopeService],
  exports: [AlertService],
})
export class AlertModule {}
