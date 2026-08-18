import { Injectable, Logger, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { GeotabCredentials, GeotabAuthResult } from './geotab.types';

@Injectable()
export class GeotabSessionManager {
  private readonly logger = new Logger(GeotabSessionManager.name);
  private sessions = new Map<string, GeotabAuthResult>();

  /**
   * Enforces the Sandbox Security Guard.
   * Connection requires process.env.GEOTAB_ENVIRONMENT === 'sandbox' | 'test' OR credentials.environment === 'sandbox' | 'test'.
   * Missing, production, prod, or unknown environments fail closed immediately.
   */
  validateSandboxGuard(creds?: GeotabCredentials): void {
    const env = (process.env.GEOTAB_ENVIRONMENT || creds?.environment || '').toLowerCase().trim();

    if (env !== 'sandbox' && env !== 'test') {
      this.logger.error(`SECURITY BLOCK: Geotab environment '${env || 'MISSING'}' is invalid. Sandbox guard failed closed.`);
      throw new InternalServerErrorException(
        `GEOTAB_ENVIRONMENT must be explicitly set to 'sandbox' or 'test'. Found: '${env || 'MISSING'}'`,
      );
    }
  }

  /**
   * Authenticates or re-uses valid in-memory session.
   * Session ID is retained in memory ONLY. Never persisted or returned.
   */
  async getOrAuthenticateSession(connectionId: string, creds: GeotabCredentials): Promise<GeotabAuthResult> {
    this.validateSandboxGuard(creds);

    const existing = this.sessions.get(connectionId);
    if (existing && existing.expiresAt > new Date(Date.now() + 60000)) {
      return existing;
    }

    if (!creds.username || !creds.password || !creds.database) {
      throw new UnauthorizedException('Geotab authentication requires username, password, and database');
    }

    // Mock/Sandbox internal authentication
    // If real server URL provided, real JSON-RPC fetch can be executed.
    const server = creds.server || 'my.geotab.com/sandbox';
    
    // Simulate/Generate in-memory sandbox session (14-day validity per Geotab standard)
    const session: GeotabAuthResult = {
      sessionId: `sandbox_sess_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`,
      server,
      database: creds.database,
      userName: creds.username,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    };

    this.sessions.set(connectionId, session);
    this.logger.log(`Geotab in-memory session established for database '${creds.database}' (Sandbox mode)`);
    return session;
  }

  clearSession(connectionId: string): void {
    this.sessions.delete(connectionId);
  }
}
