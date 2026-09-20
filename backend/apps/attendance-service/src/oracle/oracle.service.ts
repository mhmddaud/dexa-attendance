import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import oracledb from 'oracledb';

/**
 * Manages a single Oracle connection pool for the Attendance Service.
 *
 * Responsibilities:
 *  - create the pool on startup
 *  - hand out connections (getConnection)
 *  - run parameterized queries via bind parameters (execute / executeMany)
 *  - always release connections back to the pool
 *  - close the pool cleanly on shutdown
 *
 * SQL is always executed with bind parameters; never string concatenation.
 */
@Injectable()
export class OracleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OracleService.name);
  private pool: oracledb.Pool | null = null;
  private readonly poolAlias = 'attendance-pool';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    // Return query results as plain objects keyed by column name.
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    // Fetch CLOB/large text as strings by default (not needed here, but safe).
    oracledb.fetchAsString = [oracledb.CLOB];

    this.pool = await oracledb.createPool({
      poolAlias: this.poolAlias,
      user: this.configService.get<string>('ORACLE_USER'),
      password: this.configService.get<string>('ORACLE_PASSWORD'),
      connectString: this.configService.get<string>('ORACLE_CONNECT_STRING'),
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
    });

    this.logger.log('Oracle connection pool created (FREEPDB1)');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.close(10);
      this.pool = null;
      this.logger.log('Oracle connection pool closed');
    }
  }

  private getPool(): oracledb.Pool {
    if (!this.pool) {
      throw new Error('Oracle pool is not initialized');
    }
    return this.pool;
  }

  async getConnection(): Promise<oracledb.Connection> {
    return this.getPool().getConnection();
  }

  /**
   * Execute a parameterized statement and auto-commit by default.
   * Connection is always released back to the pool.
   */
  async execute<T = unknown>(
    sql: string,
    binds: oracledb.BindParameters = {},
    options: oracledb.ExecuteOptions = {},
  ): Promise<oracledb.Result<T>> {
    let connection: oracledb.Connection | undefined;
    try {
      connection = await this.getConnection();
      const result = await connection.execute<T>(sql, binds, {
        autoCommit: true,
        ...options,
      });
      return result;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          this.logger.error(
            `Failed to release Oracle connection: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }
    }
  }

  /** Lightweight connectivity check for the health endpoint. */
  async ping(): Promise<boolean> {
    try {
      const result = await this.execute<{ OK: number }>(
        'SELECT 1 AS OK FROM DUAL',
      );
      return Array.isArray(result.rows) && result.rows.length === 1;
    } catch {
      return false;
    }
  }
}
