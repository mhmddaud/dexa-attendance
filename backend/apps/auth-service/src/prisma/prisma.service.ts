import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Prisma client for the Auth Service, backed by the MySQL driver adapter
 * (Prisma 7). Owns exactly one database: dexa_auth.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const url = configService.get<string>('AUTH_DATABASE_URL');
    const adapter = new PrismaMariaDb(url as string);
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Auth database connected (dexa_auth)');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
