import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fi360-jwt-secret-change-in-production',
    });
  }

  async validate(payload: any) {
    // The decoded JWT now carries permissions, scope, and dashboard.
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
      scopeLevel: payload.scopeLevel,
      region: payload.region,
      depot: payload.depot,
      assignedVehicleId: payload.assignedVehicleId,
      dashboard: payload.dashboard,
      tenantId: payload.tenantId,
    };
  }
}
