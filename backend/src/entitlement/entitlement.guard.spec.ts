import { Test, TestingModule } from '@nestjs/testing';
import { EntitlementGuard } from './entitlement.guard';
import { Reflector } from '@nestjs/core';
import { DevelopmentEntitlementContextResolver } from './development-entitlement-resolver';
import { EntitlementService } from './entitlement.service';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('EntitlementGuard', () => {
  let guard: EntitlementGuard;
  let reflector: Reflector;
  let resolver: DevelopmentEntitlementContextResolver;
  let service: EntitlementService;

  const mockExecutionContext = (userPayload: any, handlerFn: Function): ExecutionContext => {
    return {
      getHandler: () => handlerFn,
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({
          user: userPayload,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: DevelopmentEntitlementContextResolver,
          useValue: {
            resolvePlanVersion: jest.fn(),
          },
        },
        {
          provide: EntitlementService,
          useValue: {
            evaluateFeature: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<EntitlementGuard>(EntitlementGuard);
    reflector = module.get<Reflector>(Reflector);
    resolver = module.get<DevelopmentEntitlementContextResolver>(DevelopmentEntitlementContextResolver);
    service = module.get<EntitlementService>(EntitlementService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow if no feature metadata is present', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const handler = () => {};
    const context = mockExecutionContext({ email: 'test@fi360.com' }, handler);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow if the feature is enabled for the resolved plan version', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('REPORTING');
    jest.spyOn(resolver, 'resolvePlanVersion').mockResolvedValue('active-ver-id');
    jest.spyOn(service, 'evaluateFeature').mockResolvedValue({
      allowed: true,
      featureCode: 'REPORTING',
      reason: 'ENABLED',
    });

    const handler = () => {};
    const context = mockExecutionContext({ email: 'test@fi360.com', tenantId: 'TEST_TENANT_ENTERPRISE' }, handler);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should deny with FEATURE_NOT_ENTITLED if feature is disabled', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('REPORTING');
    jest.spyOn(resolver, 'resolvePlanVersion').mockResolvedValue('active-ver-id');
    jest.spyOn(service, 'evaluateFeature').mockResolvedValue({
      allowed: false,
      featureCode: 'REPORTING',
      reason: 'DISABLED',
    });

    const handler = () => {};
    const context = mockExecutionContext({ email: 'test@fi360.com', tenantId: 'TEST_TENANT_STARTER' }, handler);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException({
        statusCode: 403,
        code: 'FEATURE_NOT_ENTITLED',
        featureCode: 'REPORTING',
      })
    );
  });

  it('should deny with FEATURE_NOT_ENTITLED if feature is not found', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('MISSING');
    jest.spyOn(resolver, 'resolvePlanVersion').mockResolvedValue('active-ver-id');
    jest.spyOn(service, 'evaluateFeature').mockResolvedValue({
      allowed: false,
      featureCode: 'MISSING',
      reason: 'FEATURE_NOT_FOUND',
    });

    const handler = () => {};
    const context = mockExecutionContext({ email: 'test@fi360.com', tenantId: 'TEST_TENANT_ENTERPRISE' }, handler);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException({
        statusCode: 403,
        code: 'FEATURE_NOT_ENTITLED',
        featureCode: 'MISSING',
      })
    );
  });

  it('should deny with NO_ENTITLEMENT_CONTEXT if resolver cannot map the tenant context', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('REPORTING');
    jest.spyOn(resolver, 'resolvePlanVersion').mockResolvedValue(null);

    const handler = () => {};
    const context = mockExecutionContext({ email: 'test@fi360.com', tenantId: 'UNKNOWN_TENANT' }, handler);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException({
        statusCode: 403,
        code: 'NO_ENTITLEMENT_CONTEXT',
        featureCode: 'REPORTING',
      })
    );
  });

  it('should fail closed (deny) when tenant context is completely missing from user payload', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('REPORTING');
    jest.spyOn(resolver, 'resolvePlanVersion').mockResolvedValue(null);

    const handler = () => {};
    const context = mockExecutionContext({ email: 'test@fi360.com' }, handler);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException({
        statusCode: 403,
        code: 'NO_ENTITLEMENT_CONTEXT',
        featureCode: 'REPORTING',
      })
    );
  });

  it('should never bypass RBAC or call DataScopeService to replace scoping logics', () => {
    // Structural architectural check: Ensure no reference to DataScopeService is injected
    const guardDependencies = Object.keys(guard);
    const hasDataScope = guardDependencies.some(d => d.toLowerCase().includes('datascope'));
    expect(hasDataScope).toBe(false);
  });
});
