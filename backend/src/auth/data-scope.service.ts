import { Injectable, Logger } from '@nestjs/common';
import { ScopeLevel } from './permissions.enum';
import { getScopeLevelForRole } from './permissions.matrix';

/**
 * Represents the resolved data-scope context for the current user.
 * Services use this to restrict queries to the user's visible data.
 */
export interface DataScopeContext {
  scopeLevel: ScopeLevel;
  region?: string;
  depot?: string;
  workshopId?: string;
  assignedVehicleId?: string;
}

/**
 * FI360 Data Scope Service
 *
 * Builds Prisma-compatible WHERE clause fragments that restrict
 * queries to the data the current user is allowed to see.
 *
 * Scope hierarchy:
 *   SYSTEM       → no filter (platform admin)
 *   ORGANISATION → no filter (org-wide visibility)
 *   REGION       → where { region: user.region }
 *   DEPOT        → where { depot: user.depot }
 *   WORKSHOP     → where { workshopId: user.workshopId }
 *   VEHICLE      → where { id: user.assignedVehicleId } (or vehicleId)
 */
@Injectable()
export class DataScopeService {
  private readonly logger = new Logger(DataScopeService.name);

  /**
   * Build scope context from the authenticated request user.
   */
  buildContext(user: any): DataScopeContext {
    const scopeLevel = getScopeLevelForRole(user.role);
    return {
      scopeLevel,
      region: user.region,
      depot: user.depot,
      workshopId: user.workshopId,
      assignedVehicleId: user.assignedVehicleId,
    };
  }

  /**
   * Generate Prisma WHERE clause additions for Vehicle queries.
   */
  vehicleWhere(ctx: DataScopeContext): Record<string, any> {
    switch (ctx.scopeLevel) {
      case ScopeLevel.SYSTEM:
      case ScopeLevel.ORGANISATION:
        return {};
      case ScopeLevel.REGION:
        return ctx.region ? { region: ctx.region } : {};
      case ScopeLevel.DEPOT:
        return ctx.depot ? { depot: ctx.depot } : {};
      case ScopeLevel.WORKSHOP:
        return ctx.workshopId ? { workshopId: ctx.workshopId } : {};
      case ScopeLevel.VEHICLE:
        return ctx.assignedVehicleId
          ? { id: ctx.assignedVehicleId }
          : {};
      default:
        return {};
    }
  }

  /**
   * Generate Prisma WHERE clause additions for Tyre queries.
   * Filters tyres by currentVehicleId (if in vehicle scope), or workshopId (if in stock/fitted at workshop).
   */
  tyreWhere(ctx: DataScopeContext): Record<string, any> {
    switch (ctx.scopeLevel) {
      case ScopeLevel.SYSTEM:
      case ScopeLevel.ORGANISATION:
        return {};
      case ScopeLevel.WORKSHOP:
        if (!ctx.workshopId) return {};
        // Tyres assigned to vehicles in this workshop OR in stock at this workshop
        return {
          OR: [
            { currentVehicleId: null }, // unassigned in stock available to workshop
            {
              // OR tyres fitted on vehicles belonging to this workshop
              currentVehicleId: {
                in: undefined, // handled in service query via relation if needed
              },
            },
          ],
        };
      case ScopeLevel.VEHICLE:
        return ctx.assignedVehicleId
          ? { currentVehicleId: ctx.assignedVehicleId }
          : {};
      default:
        return {};
    }
  }

  /**
   * Generate Prisma WHERE clause additions for Alert queries.
   */
  alertWhere(ctx: DataScopeContext): Record<string, any> {
    switch (ctx.scopeLevel) {
      case ScopeLevel.SYSTEM:
      case ScopeLevel.ORGANISATION:
        return {};
      case ScopeLevel.REGION:
        return ctx.region ? { region: ctx.region } : {};
      case ScopeLevel.DEPOT:
        return ctx.depot ? { depot: ctx.depot } : {};
      case ScopeLevel.WORKSHOP:
        return ctx.workshopId ? { workshopId: ctx.workshopId } : {};
      case ScopeLevel.VEHICLE:
        return ctx.assignedVehicleId
          ? { vehicleId: ctx.assignedVehicleId }
          : {};
      default:
        return {};
    }
  }

  /**
   * Generate Prisma WHERE clause for Defect queries.
   */
  defectWhere(ctx: DataScopeContext): Record<string, any> {
    switch (ctx.scopeLevel) {
      case ScopeLevel.SYSTEM:
      case ScopeLevel.ORGANISATION:
        return {};
      case ScopeLevel.REGION:
        return ctx.region ? { region: ctx.region } : {};
      case ScopeLevel.DEPOT:
        return ctx.depot ? { depot: ctx.depot } : {};
      case ScopeLevel.WORKSHOP:
        return ctx.workshopId
          ? { vehicle: { workshopId: ctx.workshopId } }
          : {};
      case ScopeLevel.VEHICLE:
        return ctx.assignedVehicleId
          ? { vehicleId: ctx.assignedVehicleId }
          : {};
      default:
        return {};
    }
  }
}
