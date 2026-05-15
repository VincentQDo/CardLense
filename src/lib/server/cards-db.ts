import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { cardPresets } from '$lib/data/card-presets';

import type { AddTrackedCardInput, TrackedCard } from '$lib/types/cards';

const databasePath = join(process.cwd(), 'data', 'cardlense.sqlite');

interface TrackedCardRow {
  id: string;
  preset_id: string;
  nickname: string;
  annual_renewal_date: string;
  certificate_expiry_date: string;
  free_night_used: number;
  created_at: string;
}

let database: DatabaseSync | undefined;

export function listTrackedCards(): TrackedCard[] {
  const rows = readTrackedCardRows();

  return rows.map(toTrackedCard);
}

export function addTrackedCard(input: AddTrackedCardInput): void {
  runWrite(() => {
    getDatabase()
      .prepare(
        `INSERT INTO tracked_cards (
          id,
          preset_id,
          nickname,
          annual_renewal_date,
          certificate_expiry_date,
          free_night_used
        ) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        randomUUID(),
        input.presetId,
        input.nickname,
        input.annualRenewalDate,
        input.certificateExpiryDate,
        input.freeNightUsed ? 1 : 0
      );
  });
}

export function updateFreeNightUsed(cardId: string, freeNightUsed: boolean): void {
  runWrite(() => {
    getDatabase()
      .prepare('UPDATE tracked_cards SET free_night_used = ? WHERE id = ?')
      .run(freeNightUsed ? 1 : 0, cardId);
  });
}

export function isKnownCardPreset(presetId: string): boolean {
  return cardPresets.some((preset) => preset.id === presetId);
}

function readTrackedCardRows(): TrackedCardRow[] {
  return getDatabase()
    .prepare(
      `SELECT id,
        preset_id,
        nickname,
        annual_renewal_date,
        certificate_expiry_date,
        free_night_used,
        created_at
      FROM tracked_cards
      ORDER BY date(certificate_expiry_date) ASC, datetime(created_at) DESC`
    )
    .all() as unknown as TrackedCardRow[];
}

function getDatabase(): DatabaseSync {
  if (!database || !existsSync(databasePath)) {
    closeDatabase();
    mkdirSync(dirname(databasePath), { recursive: true });
    database = new DatabaseSync(databasePath);
    database.exec(`
      CREATE TABLE IF NOT EXISTS tracked_cards (
        id TEXT PRIMARY KEY,
        preset_id TEXT NOT NULL,
        nickname TEXT NOT NULL,
        annual_renewal_date TEXT NOT NULL,
        certificate_expiry_date TEXT NOT NULL,
        free_night_used INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  return database;
}

function runWrite(write: () => void): void {
  try {
    write();
  } catch {
    closeDatabase();
    write();
  }
}

function closeDatabase(): void {
  database?.close();
  database = undefined;
}

function toTrackedCard(row: TrackedCardRow): TrackedCard {
  return {
    id: row.id,
    presetId: row.preset_id,
    nickname: row.nickname,
    annualRenewalDate: row.annual_renewal_date,
    certificateExpiryDate: row.certificate_expiry_date,
    freeNightUsed: row.free_night_used === 1,
    createdAt: row.created_at
  };
}
