import { Test, TestingModule } from '@nestjs/testing';
import { GeotabProviderAdapter } from './geotab-provider.adapter';
import { GeotabSessionManager } from './geotab.session';
import { GeotabMapper } from './geotab.mapper';
import { CryptoService } from '../../../crypto/crypto.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('GeotabProviderAdapter & GeotabMapper', () => {
  let adapter: GeotabProviderAdapter;
  let sessionManager: GeotabSessionManager;
  let mapper: GeotabMapper;

  beforeEach(async () => {
    process.env.FI360_TELEMATICS_ENCRYPTION_KEY = '12345678901234567890123456789012';
    process.env.GEOTAB_ENVIRONMENT = 'sandbox';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeotabProviderAdapter,
        GeotabSessionManager,
        GeotabMapper,
        CryptoService,
      ],
    }).compile();

    adapter = module.get<GeotabProviderAdapter>(GeotabProviderAdapter);
    sessionManager = module.get<GeotabSessionManager>(GeotabSessionManager);
    mapper = module.get<GeotabMapper>(GeotabMapper);

    const cryptoService = module.get<CryptoService>(CryptoService);
    cryptoService.onModuleInit();
  });

  afterEach(() => {
    delete process.env.GEOTAB_ENVIRONMENT;
    delete process.env.FI360_TELEMATICS_ENCRYPTION_KEY;
  });

  describe('1. Sandbox Guard Enforcement', () => {
    it('should ALLOW environment = sandbox', () => {
      process.env.GEOTAB_ENVIRONMENT = 'sandbox';
      expect(() => sessionManager.validateSandboxGuard()).not.toThrow();
    });

    it('should ALLOW environment = test', () => {
      process.env.GEOTAB_ENVIRONMENT = 'test';
      expect(() => sessionManager.validateSandboxGuard()).not.toThrow();
    });

    it('should DENY environment = production', () => {
      process.env.GEOTAB_ENVIRONMENT = 'production';
      expect(() => sessionManager.validateSandboxGuard()).toThrow(InternalServerErrorException);
    });

    it('should DENY environment = prod', () => {
      process.env.GEOTAB_ENVIRONMENT = 'prod';
      expect(() => sessionManager.validateSandboxGuard()).toThrow(InternalServerErrorException);
    });

    it('should DENY missing environment', () => {
      delete process.env.GEOTAB_ENVIRONMENT;
      expect(() => sessionManager.validateSandboxGuard()).toThrow(InternalServerErrorException);
    });

    it('should DENY unknown environment', () => {
      process.env.GEOTAB_ENVIRONMENT = 'unknown_env';
      expect(() => sessionManager.validateSandboxGuard()).toThrow(InternalServerErrorException);
    });
  });

  describe('2. Unit Conversions', () => {
    it('Odometer: meters to km (1000 -> 1, 100000 -> 100)', () => {
      expect(mapper.convertOdometerMetersToKm(1000)).toBe(1);
      expect(mapper.convertOdometerMetersToKm(100000)).toBe(100);
      expect(mapper.convertOdometerMetersToKm(null)).toBeNull();
      expect(mapper.convertOdometerMetersToKm(undefined)).toBeNull();
    });

    it('Engine Hours: seconds to hours (3600 -> 1, 7200 -> 2)', () => {
      expect(mapper.convertEngineHoursSecondsToHours(3600)).toBe(1);
      expect(mapper.convertEngineHoursSecondsToHours(7200)).toBe(2);
      expect(mapper.convertEngineHoursSecondsToHours(null)).toBeNull();
      expect(mapper.convertEngineHoursSecondsToHours(undefined)).toBeNull();
    });

    it('Fuel Level: 0-1 to 0-100% and 0-100 retained, missing stays null', () => {
      expect(mapper.normalizeFuelLevel(0.75)).toBe(75);
      expect(mapper.normalizeFuelLevel(75)).toBe(75);
      expect(mapper.normalizeFuelLevel(null)).toBeNull();
      expect(mapper.normalizeFuelLevel(undefined)).toBeNull();
    });
  });

  describe('3. Candidate Vehicle Matching', () => {
    const existingVehicles = [
      { id: 'v1', vin: '1G1N55SL2DA100101', registrationNumber: 'KCA-0342X' },
      { id: 'v2', vin: '1NKHXL4X5JJ200202', registrationNumber: 'KCF-9988Z' },
    ];
    const existingMappings = [{ externalVehicleId: 'b_existing', vehicleId: 'v1' }];

    it('should match existing explicit identity', () => {
      const device = { id: 'b_existing', serialNumber: 'SN-01' };
      const res = mapper.matchDeviceToCandidates(device, existingVehicles, existingMappings);
      expect(res.matchStatus).toBe('MATCHED_EXISTING');
      expect(res.candidateVehicleId).toBe('v1');
    });

    it('should match exact VIN', () => {
      const device = { id: 'b_new', vin: '1G1N55SL2DA100101' };
      const res = mapper.matchDeviceToCandidates(device, existingVehicles, []);
      expect(res.matchStatus).toBe('MATCHED_VIN');
      expect(res.candidateVehicleId).toBe('v1');
    });

    it('should match exact Registration', () => {
      const device = { id: 'b_new', licensePlate: 'KCF-9988Z' };
      const res = mapper.matchDeviceToCandidates(device, existingVehicles, []);
      expect(res.matchStatus).toBe('MATCHED_REGISTRATION');
      expect(res.candidateVehicleId).toBe('v2');
    });

    it('should flag MANUAL_REVIEW for ambiguous matches', () => {
      const multiVinVehicles = [
        { id: 'v1', vin: 'DUPLICATE_VIN', registrationNumber: 'REG-1' },
        { id: 'v2', vin: 'DUPLICATE_VIN', registrationNumber: 'REG-2' },
      ];
      const device = { id: 'b_ambiguous', vin: 'DUPLICATE_VIN' };
      const res = mapper.matchDeviceToCandidates(device, multiVinVehicles, []);
      expect(res.matchStatus).toBe('MANUAL_REVIEW');
      expect(res.candidateVehicleId).toBeUndefined();
    });

    it('should return UNMAPPED when no match is found', () => {
      const device = { id: 'b_unknown', vin: 'UNKNOWN_VIN', licensePlate: 'UNKNOWN_REG' };
      const res = mapper.matchDeviceToCandidates(device, existingVehicles, []);
      expect(res.matchStatus).toBe('UNMAPPED');
      expect(res.candidateVehicleId).toBeUndefined();
    });
  });

  describe('4. In-Memory Session Management', () => {
    it('should hold session in-memory and not leak sessionId', async () => {
      const creds = { username: 'test_user', password: 'test_password', database: 'test_db', environment: 'sandbox' };
      const session = await sessionManager.getOrAuthenticateSession('conn_1', creds);
      expect(session.sessionId).toBeDefined();
      expect(session.sessionId.startsWith('sandbox_sess_')).toBeTruthy();
      expect(session.database).toBe('test_db');
    });
  });
});
