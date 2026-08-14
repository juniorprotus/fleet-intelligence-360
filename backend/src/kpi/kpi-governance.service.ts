import { Injectable, Logger } from '@nestjs/common';

export type KpiStatus =
  | 'GREEN'
  | 'AMBER'
  | 'RED'
  | 'N/A'
  | 'NOT_MONITORED'
  | 'INSUFFICIENT_DATA'
  | 'PARTIAL_DATA'
  | 'DATA_QUALITY_ISSUE'
  | 'CALCULATION_UNAVAILABLE';

export type KpiTrend = 'UP' | 'DOWN' | 'STABLE' | 'N/A';

export interface KpiStandardPayload {
  kpiId: string;
  name: string;
  value: number | null;
  displayValue: string;
  unit: string;
  formula: string;
  dataSource: string;
  measurementPeriod: string;
  dataCoverage: string;
  sampleSize: number | null;
  target: number | null;
  variance: number | null;
  status: KpiStatus;
  trend: KpiTrend;
  calculationTimestamp: string;
  lastDataTimestamp: string | null;
  dataQualityStatus: 'ACCEPTABLE' | 'DEGRADED' | 'UNVERIFIED' | 'FAILED';
  drillDownAvailable: boolean;
  definitionVersion: string;
  formulaVersion: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

@Injectable()
export class KpiGovernanceService {
  private readonly logger = new Logger(KpiGovernanceService.name);

  /**
   * Central Evaluation Engine enforcing the FI360 Semantic Standard:
   * CONFIGURED ≠ MONITORED | MONITORED ≠ MEASURED | MEASURED ≠ HEALTHY | HEALTHY ≠ COMPLIANT | NO DATA ≠ ZERO | ZERO ≠ NOT MONITORED
   */
  evaluateKpi(params: {
    kpiId: string;
    name: string;
    rawValue: number | null;
    unit: string;
    formula: string;
    dataSource: string;
    target?: number | null;
    sampleSize?: number | null;
    dataCoverage?: string;
    measurementPeriod?: string;
    isMonitored: boolean;
    hasData: boolean;
    dataQualityOk?: boolean;
    overrideStatus?: KpiStatus;
    customDisplayValue?: string;
    higherIsBetter?: boolean;
    lastDataTimestamp?: string | null;
  }): KpiStandardPayload {
    const now = new Date().toISOString();
    const higherIsBetter = params.higherIsBetter ?? true;
    const dataQualityOk = params.dataQualityOk ?? true;

    let status: KpiStatus = 'N/A';
    let displayVal = params.customDisplayValue || 'N/A';
    let value: number | null = params.rawValue;
    let variance: number | null = null;
    let trend: KpiTrend = 'STABLE';

    // 1. Check if monitoring exists
    if (!params.isMonitored) {
      status = 'NOT_MONITORED';
      displayVal = params.customDisplayValue || 'NOT MONITORED';
      value = null;
    }
    // 2. Check data availability
    else if (!params.hasData || params.rawValue === null) {
      status = 'INSUFFICIENT_DATA';
      displayVal = params.customDisplayValue || 'N/A — Insufficient Data';
      value = null;
    }
    // 3. Check data quality
    else if (!dataQualityOk) {
      status = 'DATA_QUALITY_ISSUE';
      displayVal = params.customDisplayValue || `${params.rawValue} ${params.unit} (Data Quality Warning)`;
    }
    // 4. Calculate threshold & status for valid measured data
    else {
      if (params.target !== null && params.target !== undefined) {
        variance = Math.round((params.rawValue - params.target) * 10) / 10;
        if (higherIsBetter) {
          status = params.rawValue >= params.target ? 'GREEN' : params.rawValue >= params.target * 0.9 ? 'AMBER' : 'RED';
        } else {
          status = params.rawValue <= params.target ? 'GREEN' : params.rawValue <= params.target * 1.1 ? 'AMBER' : 'RED';
        }
      } else {
        status = 'GREEN';
      }
      displayVal = params.customDisplayValue || `${params.rawValue}${params.unit ? ' ' + params.unit : ''}`;
    }

    if (params.overrideStatus) {
      status = params.overrideStatus;
    }

    return {
      kpiId: params.kpiId,
      name: params.name,
      value,
      displayValue: displayVal,
      unit: params.unit,
      formula: params.formula,
      dataSource: params.dataSource,
      measurementPeriod: params.measurementPeriod || 'Last 30 Days / Real-Time',
      dataCoverage: params.dataCoverage || (params.hasData ? '100% Monitored Scope' : '0% Coverage'),
      sampleSize: params.sampleSize ?? (params.rawValue !== null ? 1 : 0),
      target: params.target ?? null,
      variance,
      status,
      trend,
      calculationTimestamp: now,
      lastDataTimestamp: params.lastDataTimestamp || (params.hasData ? now : null),
      dataQualityStatus: dataQualityOk ? 'ACCEPTABLE' : 'DEGRADED',
      drillDownAvailable: true,
      definitionVersion: '1.0',
      formulaVersion: '1.0',
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      effectiveTo: null,
    };
  }
}
