/**
 * DepreciationService — Pure calculation engine for FI360 vehicle book value.
 *
 * Rules:
 *  - book value >= residualValue (floor enforced)
 *  - accumulatedDepreciation <= depreciableBase (ceiling enforced)
 *  - USAGE_BASED_KM with missing odometer data returns InsufficientDataResult
 *  - No hard-coded production values. All values from profile.
 */

export interface DepreciationProfile {
  acquisitionCost: number;      // gross cost
  capitalizedCost: number;      // depreciable basis
  residualValue: number;
  depreciationRatePercent: number;
  usefulLifeYears: number;
  usefulLifeKm: number;
  depreciationMethod: string;
  inServiceDate: Date;
}

export interface DepreciationResult {
  bookValue: number;
  accumulatedDepreciation: number;
  depreciableBase: number;
  yearsElapsed: number;
  kmElapsed: number | null;
  method: string;
  depreciationStartDate: Date;
  dataQuality: 'CALCULATED' | 'INSUFFICIENT_DATA' | 'FLOOR_APPLIED';
  notes?: string;
}

export class DepreciationService {
  /**
   * Calculate current book value using the specified method.
   * @param profile - the vehicle financial profile
   * @param currentOdometerKm - current odometer reading (required for USAGE_BASED_KM)
   * @param asOfDate - point in time for calculation (defaults to now)
   */
  calculate(
    profile: DepreciationProfile,
    currentOdometerKm?: number,
    asOfDate: Date = new Date(),
  ): DepreciationResult {
    const { capitalizedCost, residualValue, inServiceDate } = profile;
    const depreciableBase = Math.max(0, capitalizedCost - residualValue);

    // Elapsed years from in-service date to asOfDate
    const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
    const rawYearsElapsed = (asOfDate.getTime() - new Date(inServiceDate).getTime()) / msPerYear;
    const yearsElapsed = Math.max(0, rawYearsElapsed);

    switch (profile.depreciationMethod) {
      case 'STRAIGHT_LINE':
        return this.straightLine(profile, depreciableBase, yearsElapsed);

      case 'REDUCING_BALANCE':
        return this.reducingBalance(profile, depreciableBase, yearsElapsed);

      case 'USAGE_BASED_KM':
        return this.usageBased(profile, depreciableBase, yearsElapsed, currentOdometerKm);

      default:
        return {
          bookValue: capitalizedCost,
          accumulatedDepreciation: 0,
          depreciableBase,
          yearsElapsed,
          kmElapsed: null,
          method: profile.depreciationMethod,
          depreciationStartDate: inServiceDate,
          dataQuality: 'INSUFFICIENT_DATA',
          notes: `Unknown depreciation method: ${profile.depreciationMethod}`,
        };
    }
  }

  private straightLine(
    profile: DepreciationProfile,
    depreciableBase: number,
    yearsElapsed: number,
  ): DepreciationResult {
    const usefulLife = profile.usefulLifeYears;
    const annualDepreciation = usefulLife > 0 ? depreciableBase / usefulLife : 0;
    
    let floorApplied = false;
    let accumulated = annualDepreciation * yearsElapsed;

    if (accumulated >= depreciableBase || (usefulLife > 0 && yearsElapsed >= usefulLife)) {
      accumulated = depreciableBase;
      floorApplied = true;
    }

    let bookValue = profile.capitalizedCost - accumulated;
    if (bookValue <= profile.residualValue) {
      bookValue = profile.residualValue;
      accumulated = depreciableBase;
      floorApplied = true;
    }

    return {
      bookValue: this.round(bookValue),
      accumulatedDepreciation: this.round(accumulated),
      depreciableBase: this.round(depreciableBase),
      yearsElapsed: this.round(yearsElapsed, 4),
      kmElapsed: null,
      method: 'STRAIGHT_LINE',
      depreciationStartDate: profile.inServiceDate,
      dataQuality: floorApplied ? 'FLOOR_APPLIED' : 'CALCULATED',
    };
  }

  private reducingBalance(
    profile: DepreciationProfile,
    depreciableBase: number,
    yearsElapsed: number,
  ): DepreciationResult {
    const rate = profile.depreciationRatePercent / 100;
    // Book value = capitalizedCost * (1 - rate)^years
    let bookValue = profile.capitalizedCost * Math.pow(Math.max(0, 1 - rate), yearsElapsed);
    let floorApplied = false;

    if (bookValue <= profile.residualValue) {
      bookValue = profile.residualValue;
      floorApplied = true;
    }

    let accumulated = profile.capitalizedCost - bookValue;
    if (accumulated >= depreciableBase) {
      accumulated = depreciableBase;
      floorApplied = true;
    }

    return {
      bookValue: this.round(bookValue),
      accumulatedDepreciation: this.round(accumulated),
      depreciableBase: this.round(depreciableBase),
      yearsElapsed: this.round(yearsElapsed, 4),
      kmElapsed: null,
      method: 'REDUCING_BALANCE',
      depreciationStartDate: profile.inServiceDate,
      dataQuality: floorApplied ? 'FLOOR_APPLIED' : 'CALCULATED',
    };
  }

  private usageBased(
    profile: DepreciationProfile,
    depreciableBase: number,
    yearsElapsed: number,
    currentOdometerKm: number | undefined,
  ): DepreciationResult {
    if (currentOdometerKm === undefined || currentOdometerKm === null) {
      return {
        bookValue: profile.capitalizedCost,
        accumulatedDepreciation: 0,
        depreciableBase,
        yearsElapsed: this.round(yearsElapsed, 4),
        kmElapsed: null,
        method: 'USAGE_BASED_KM',
        depreciationStartDate: profile.inServiceDate,
        dataQuality: 'INSUFFICIENT_DATA',
        notes: 'Odometer reading required for USAGE_BASED_KM depreciation. No valid reading available.',
      };
    }

    const kmElapsed = Math.max(0, currentOdometerKm);
    const usefulLifeKm = profile.usefulLifeKm;
    if (usefulLifeKm <= 0) {
      return {
        bookValue: profile.capitalizedCost,
        accumulatedDepreciation: 0,
        depreciableBase,
        yearsElapsed: this.round(yearsElapsed, 4),
        kmElapsed,
        method: 'USAGE_BASED_KM',
        depreciationStartDate: profile.inServiceDate,
        dataQuality: 'INSUFFICIENT_DATA',
        notes: 'usefulLifeKm must be > 0 for USAGE_BASED_KM depreciation.',
      };
    }

    let floorApplied = false;
    const usageFraction = Math.min(kmElapsed / usefulLifeKm, 1);
    let accumulated = depreciableBase * usageFraction;

    if (accumulated >= depreciableBase || kmElapsed >= usefulLifeKm) {
      accumulated = depreciableBase;
      floorApplied = true;
    }

    let bookValue = profile.capitalizedCost - accumulated;
    if (bookValue <= profile.residualValue) {
      bookValue = profile.residualValue;
      accumulated = depreciableBase;
      floorApplied = true;
    }

    return {
      bookValue: this.round(bookValue),
      accumulatedDepreciation: this.round(accumulated),
      depreciableBase: this.round(depreciableBase),
      yearsElapsed: this.round(yearsElapsed, 4),
      kmElapsed,
      method: 'USAGE_BASED_KM',
      depreciationStartDate: profile.inServiceDate,
      dataQuality: floorApplied ? 'FLOOR_APPLIED' : 'CALCULATED',
    };
  }

  private round(value: number, decimals = 2): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}
