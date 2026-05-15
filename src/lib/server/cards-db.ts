import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { cardPresets } from '$lib/data/card-presets';
import { getDaysUntilDate, getNextAnnualDate } from '$lib/utils/card-dates';

import type { AddTrackedCardInput, TrackedCard, UpdateTrackedCardInput } from '$lib/types/cards';

const databasePath = join(process.cwd(), 'data', 'cardlense.sqlite');

interface TrackedCardRow {
  id: string;
  preset_id: string;
  nickname: string;
  annual_renewal_date: string;
  certificate_expiry_date: string;
  free_night_used: number;
  free_night_redemption_value_cents: number;
  created_at: string;
}

interface TableColumnRow {
  name: string;
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
          free_night_used,
          free_night_redemption_value_cents
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        randomUUID(),
        input.presetId,
        input.nickname,
        input.annualRenewalDate,
        input.certificateExpiryDate,
        input.freeNightUsed ? 1 : 0,
        toCents(input.freeNightUsed ? input.freeNightRedemptionValue : 0)
      );
  });
}

export function updateFreeNightUsed(
  cardId: string,
  freeNightUsed: boolean,
  freeNightRedemptionValue: number
): void {
  runWrite(() => {
    getDatabase()
      .prepare(
        `UPDATE tracked_cards
        SET free_night_used = ?,
          free_night_redemption_value_cents =
            CASE WHEN ? = 1 THEN ? ELSE 0 END
        WHERE id = ?`
      )
      .run(
        freeNightUsed ? 1 : 0,
        freeNightUsed ? 1 : 0,
        toCents(freeNightUsed ? freeNightRedemptionValue : 0),
        cardId
      );
  });
}

export function updateTrackedCard(input: UpdateTrackedCardInput): void {
  runWrite(() => {
    getDatabase()
      .prepare(
        `UPDATE tracked_cards
        SET preset_id = ?,
          nickname = ?,
          annual_renewal_date = ?,
          certificate_expiry_date = ?,
          free_night_used = ?,
          free_night_redemption_value_cents = ?
        WHERE id = ?`
      )
      .run(
        input.presetId,
        input.nickname,
        input.annualRenewalDate,
        input.certificateExpiryDate,
        input.freeNightUsed ? 1 : 0,
        toCents(input.freeNightUsed ? input.freeNightRedemptionValue : 0),
        input.id
      );
  });
}

export function deleteTrackedCard(cardId: string): void {
  runWrite(() => {
    getDatabase().prepare('DELETE FROM tracked_cards WHERE id = ?').run(cardId);
  });
}

export function rollTrackedCard(cardId: string): boolean {
  const card = getTrackedCardRow(cardId);

  if (!card || !isRolloverEligible(card)) {
    return false;
  }

  runWrite(() => {
    getDatabase()
      .prepare(
        `UPDATE tracked_cards
        SET annual_renewal_date = ?,
          certificate_expiry_date = ?,
          free_night_used = 0,
          free_night_redemption_value_cents = 0
        WHERE id = ?`
      )
      .run(
        getNextAnnualDate(card.annual_renewal_date),
        getNextAnnualDate(card.certificate_expiry_date),
        cardId
      );
  });

  return true;
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
        free_night_redemption_value_cents,
        created_at
      FROM tracked_cards
      ORDER BY date(certificate_expiry_date) ASC, datetime(created_at) DESC`
    )
    .all() as unknown as TrackedCardRow[];
}

function getTrackedCardRow(cardId: string): TrackedCardRow | undefined {
  const row = getDatabase()
    .prepare(
      `SELECT id,
        preset_id,
        nickname,
        annual_renewal_date,
        certificate_expiry_date,
        free_night_used,
        free_night_redemption_value_cents,
        created_at
      FROM tracked_cards
      WHERE id = ?`
    )
    .get(cardId) as unknown as TrackedCardRow | undefined;

  return row;
}

function getDatabase(): DatabaseSync {
  if (!database || !existsSync(databasePath)) {
    closeDatabase();
    mkdirSync(dirname(databasePath), { recursive: true });
    database = new DatabaseSync(databasePath);
    ensureSchema(database);
  }

  return database;
}

function ensureSchema(openDatabase: DatabaseSync): void {
  openDatabase.exec(`
      CREATE TABLE IF NOT EXISTS tracked_cards (
        id TEXT PRIMARY KEY,
        preset_id TEXT NOT NULL,
        nickname TEXT NOT NULL,
        annual_renewal_date TEXT NOT NULL,
        certificate_expiry_date TEXT NOT NULL,
        free_night_used INTEGER NOT NULL DEFAULT 0,
        free_night_redemption_value_cents INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

  const columns = openDatabase
    .prepare('PRAGMA table_info(tracked_cards)')
    .all() as unknown as TableColumnRow[];

  if (!columns.some((column) => column.name === 'free_night_redemption_value_cents')) {
    openDatabase.exec(
      'ALTER TABLE tracked_cards ADD COLUMN free_night_redemption_value_cents INTEGER NOT NULL DEFAULT 0'
    );
  }
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
    freeNightRedemptionValue: fromCents(row.free_night_redemption_value_cents),
    createdAt: row.created_at
  };
}

function toCents(value: number): number {
  return Math.round(value * 100);
}

function fromCents(value: number): number {
  return value / 100;
}

function isRolloverEligible(card: TrackedCardRow): boolean {
  return isPastDate(card.annual_renewal_date) || isPastDate(card.certificate_expiry_date);
}

function isPastDate(dateInput: string): boolean {
  const daysUntilDate = getDaysUntilDate(dateInput);

  return daysUntilDate !== undefined && daysUntilDate < 0;
}
