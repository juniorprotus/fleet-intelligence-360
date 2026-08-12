import { Injectable, UnauthorizedException, Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import {
  getPermissionsForRole,
  getScopeLevelForRole,
  getDashboardForRole,
} from './permissions.matrix';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.seedDemoWorkshops();
    await this.seedDemoUsers();
  }

  private async seedDemoWorkshops() {
    let mainWorkshop = await this.prisma.workshop.findUnique({
      where: { code: 'WS-NBI-01' },
    });

    if (!mainWorkshop) {
      mainWorkshop = await this.prisma.workshop.create({
        data: {
          code: 'WS-NBI-01',
          name: 'Nairobi Central Workshop',
          region: 'Nairobi',
          depot: 'Nairobi Main Depot',
          address: 'Enterprise Road, Industrial Area, Nairobi',
        },
      });
      this.logger.log(`Seeded demo workshop: WS-NBI-01 [${mainWorkshop.id}]`);
    }

    return mainWorkshop;
  }

  private async seedDemoUsers() {
    const mainWorkshop = await this.prisma.workshop.findUnique({
      where: { code: 'WS-NBI-01' },
    });

    const demoUsers = [
      {
        email: 'admin@fi360.com',
        firstName: 'System', lastName: 'Admin',
        role: UserRole.SUPER_ADMIN,
        department: 'IT & Platform',
        region: null, depot: null, workshopId: null, assignedVehicleId: null,
      },
      {
        email: 'ceo@fi360.com',
        firstName: 'Joseph', lastName: 'Kariuki',
        role: UserRole.CEO,
        department: 'Executive Office',
        region: null, depot: null, workshopId: null, assignedVehicleId: null,
      },
      {
        email: 'fleet.manager@fi360.com',
        firstName: 'David', lastName: 'Mwangi',
        role: UserRole.FLEET_MANAGER,
        department: 'Fleet Operations',
        region: 'Nairobi', depot: 'Nairobi Main Depot', workshopId: null, assignedVehicleId: null,
      },
      {
        email: 'supervisor@fi360.com',
        firstName: 'Samuel', lastName: 'Kiprono',
        role: UserRole.TYRE_SUPERVISOR,
        department: 'Workshop',
        region: 'Nairobi', depot: 'Nairobi Main Depot', workshopId: mainWorkshop?.id || null, assignedVehicleId: null,
      },
      {
        email: 'technician@fi360.com',
        firstName: 'Peter', lastName: 'Ochieng',
        role: UserRole.TYRE_TECHNICIAN,
        department: 'Workshop',
        region: 'Nairobi', depot: 'Nairobi Main Depot', workshopId: mainWorkshop?.id || null, assignedVehicleId: null,
      },
      {
        email: 'finance.manager@fi360.com',
        firstName: 'Grace', lastName: 'Wanjiru',
        role: UserRole.FINANCE_MANAGER,
        department: 'Finance & Accounting',
        region: null, depot: null, workshopId: null, assignedVehicleId: null,
      },
      {
        email: 'driver@fi360.com',
        firstName: 'James', lastName: 'Otieno',
        role: UserRole.DRIVER,
        department: 'Logistics',
        region: 'Nairobi', depot: 'Nairobi Main Depot', workshopId: null, assignedVehicleId: 'KDA-123A',
      },
      {
        email: 'auditor@fi360.com',
        firstName: 'Sarah', lastName: 'Kamau',
        role: UserRole.AUDITOR,
        department: 'Compliance & Audit',
        region: null, depot: null, workshopId: null, assignedVehicleId: null,
      },
    ];

    const hashedPassword = await bcrypt.hash('Pinkypinky@40', 10);

    for (const u of demoUsers) {
      const existing = await this.prisma.user.findUnique({ where: { email: u.email } });
      if (!existing) {
        await this.prisma.user.create({
          data: {
            email: u.email,
            password: hashedPassword,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
            department: u.department,
            region: u.region,
            depot: u.depot,
            workshopId: u.workshopId,
            assignedVehicleId: u.assignedVehicleId,
          },
        });
        this.logger.log(`Seeded demo user: ${u.email} [${u.role}]`);
      } else if (existing.role !== u.role || (u.workshopId && existing.workshopId !== u.workshopId)) {
        await this.prisma.user.update({
          where: { email: u.email },
          data: {
            role: u.role,
            depot: u.depot,
            workshopId: u.workshopId,
            assignedVehicleId: u.assignedVehicleId,
          },
        });
        this.logger.log(`Updated demo user: ${u.email} → [${u.role}]`);
      }
    }
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.isActive) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const permissions = getPermissionsForRole(user.role);
    const scopeLevel = getScopeLevelForRole(user.role);
    const dashboard = getDashboardForRole(user.role);

    // Include full RBAC context in JWT payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions,
      scopeLevel,
      region: user.region,
      depot: user.depot,
      workshopId: user.workshopId,
      assignedVehicleId: user.assignedVehicleId,
      dashboard,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions,
        scopeLevel,
        region: user.region,
        depot: user.depot,
        workshopId: user.workshopId,
        assignedVehicleId: user.assignedVehicleId,
        dashboard,
      },
    };
  }
}
