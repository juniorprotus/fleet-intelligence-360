import { DepreciationService, DepreciationProfile } from './depreciation.service';

describe('DepreciationService', () => {
  let service: DepreciationService;

  beforeEach(() => {
    service = new DepreciationService();
  });

  describe('STRAIGHT_LINE', () => {
    it('should calculate straight line depreciation accurately', () => {
      const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
      const asOfDate = new Date('2025-01-01T00:00:00Z');
      const inServiceDate = new Date(asOfDate.getTime() - 2 * msPerYear); // Exactly 2.0 years ago

      const profile: DepreciationProfile = {
        acquisitionCost: 10000000,
        capitalizedCost: 10000000,
        residualValue: 2000000,
        depreciationRatePercent: 20,
        usefulLifeYears: 5,
        usefulLifeKm: 500000,
        depreciationMethod: 'STRAIGHT_LINE',
        inServiceDate,
      };

      const result = service.calculate(profile, 0, asOfDate);
      // Depreciable base = 10,000,000 - 2,000,000 = 8,000,000
      // Annual dep = 8,000,000 / 5 = 1,600,000
      // 2 years dep = 3,200,000
      // Book value = 6,800,000
      expect(result.depreciableBase).toBe(8000000);
      expect(result.accumulatedDepreciation).toBe(3200000);
      expect(result.bookValue).toBe(6800000);
      expect(result.dataQuality).toBe('CALCULATED');
    });

    it('should enforce floor at residual value when depreciation exceeds useful life', () => {
      const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
      const asOfDate = new Date('2025-01-01T00:00:00Z');
      const inServiceDate = new Date(asOfDate.getTime() - 10 * msPerYear); // 10 years ago for 5 yr life

      const profile: DepreciationProfile = {
        acquisitionCost: 10000000,
        capitalizedCost: 10000000,
        residualValue: 1500000,
        depreciationRatePercent: 20,
        usefulLifeYears: 5,
        usefulLifeKm: 500000,
        depreciationMethod: 'STRAIGHT_LINE',
        inServiceDate,
      };

      const result = service.calculate(profile, 0, asOfDate);
      expect(result.bookValue).toBe(1500000); // exactly residual value
      expect(result.accumulatedDepreciation).toBe(8500000); // exactly depreciable base
      expect(result.dataQuality).toBe('FLOOR_APPLIED');
    });
  });

  describe('REDUCING_BALANCE', () => {
    it('should calculate reducing balance depreciation accurately', () => {
      const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
      const asOfDate = new Date('2025-01-01T00:00:00Z');
      const inServiceDate = new Date(asOfDate.getTime() - 1 * msPerYear); // Exactly 1.0 year ago

      const profile: DepreciationProfile = {
        acquisitionCost: 5000000,
        capitalizedCost: 5000000,
        residualValue: 500000,
        depreciationRatePercent: 20, // 20% annual rate
        usefulLifeYears: 5,
        usefulLifeKm: 500000,
        depreciationMethod: 'REDUCING_BALANCE',
        inServiceDate,
      };

      const result = service.calculate(profile, 0, asOfDate);
      // 5,000,000 * (1 - 0.2)^1 = 4,000,000
      expect(result.bookValue).toBe(4000000);
      expect(result.accumulatedDepreciation).toBe(1000000);
      expect(result.dataQuality).toBe('CALCULATED');
    });
  });

  describe('USAGE_BASED_KM', () => {
    it('should calculate usage based depreciation from odometer', () => {
      const profile: DepreciationProfile = {
        acquisitionCost: 8000000,
        capitalizedCost: 8000000,
        residualValue: 1000000,
        depreciationRatePercent: 0,
        usefulLifeYears: 5,
        usefulLifeKm: 500000, // 500,000 km life
        depreciationMethod: 'USAGE_BASED_KM',
        inServiceDate: new Date('2024-01-01'),
      };

      // 250,000 km = 50% usage
      const result = service.calculate(profile, 250000, new Date('2025-01-01'));
      // Depreciable base = 7,000,000
      // Acc dep = 7,000,000 * 0.5 = 3,500,000
      // Book value = 8,000,000 - 3,500,000 = 4,500,000
      expect(result.depreciableBase).toBe(7000000);
      expect(result.accumulatedDepreciation).toBe(3500000);
      expect(result.bookValue).toBe(4500000);
      expect(result.dataQuality).toBe('CALCULATED');
    });

    it('should return INSUFFICIENT_DATA when odometer reading is missing', () => {
      const profile: DepreciationProfile = {
        acquisitionCost: 8000000,
        capitalizedCost: 8000000,
        residualValue: 1000000,
        depreciationRatePercent: 0,
        usefulLifeYears: 5,
        usefulLifeKm: 500000,
        depreciationMethod: 'USAGE_BASED_KM',
        inServiceDate: new Date('2024-01-01'),
      };

      const result = service.calculate(profile, undefined, new Date());
      expect(result.dataQuality).toBe('INSUFFICIENT_DATA');
      expect(result.bookValue).toBe(8000000);
      expect(result.accumulatedDepreciation).toBe(0);
    });
  });
});
