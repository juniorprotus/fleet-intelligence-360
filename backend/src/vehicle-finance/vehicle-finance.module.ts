import { Module } from '@nestjs/common';
import { VehicleFinanceController } from './vehicle-finance.controller';
import { ProfileService } from './profile.service';
import { AgreementService } from './agreement.service';
import { BookValueService } from './book-value.service';
import { DisposalService } from './disposal.service';
import { DepreciationService } from './depreciation.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, AuditModule, PrismaModule],
  controllers: [VehicleFinanceController],
  providers: [
    ProfileService,
    AgreementService,
    BookValueService,
    DisposalService,
    DepreciationService,
  ],
  exports: [
    ProfileService,
    AgreementService,
    BookValueService,
    DisposalService,
    DepreciationService,
  ],
})
export class VehicleFinanceModule {}
