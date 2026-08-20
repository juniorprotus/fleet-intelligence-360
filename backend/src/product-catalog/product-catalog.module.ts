import { Module } from '@nestjs/common';
import { ProductCatalogController } from './product-catalog.controller';
import { ProductCatalogService } from './product-catalog.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, AuditModule, PrismaModule],
  controllers: [ProductCatalogController],
  providers: [ProductCatalogService],
  exports: [ProductCatalogService],
})
export class ProductCatalogModule {}
