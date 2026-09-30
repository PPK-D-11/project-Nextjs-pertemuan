#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1091ab50ef0e334d39447aa6aa8205632adc86091f32156fda6fe47dd4243089/contract';
import endContract from '../../snapshots/1091ab50ef0e334d39447aa6aa8205632adc86091f32156fda6fe47dd4243089/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b8ac75ab90c78cb8bef54bd13f9dcd598f328229a4d163070bb8ec95df3e378e/contract';
import startContract from '../../snapshots/b8ac75ab90c78cb8bef54bd13f9dcd598f328229a4d163070bb8ec95df3e378e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'budget',
        columns: [
          col('amount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('month', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('year', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'budget',
        constraint: 'budget_userId_month_year_key',
        columns: ['userId', 'month', 'year'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'budget',
        index: 'budget_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'budget',
        foreignKey: {
          name: 'budget_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
