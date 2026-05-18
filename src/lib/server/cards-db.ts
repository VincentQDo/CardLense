import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import Database from 'better-sqlite3';

import { cardPresets } from '$lib/data/card-presets';
import { databasePath, ensureDatabaseDirectory } from '$lib/server/database';
import {
  getAnnualizedCreditValue,
  getCreditCadenceLabel,
  getCreditPeriod,
  getDaysUntilDate,
  getNextAnnualDate
} from '$lib/utils/card-dates';

import type {
  AddTrackedCardInput,
  CardPreset,
  CreditDefinition,
  CreditValuation,
  TrackedCard,
  UpdateTrackedCardInput
} from '$lib/types/cards';

interface TrackedCardRow {
  id: string;
  user_id: string;
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

interface CreditValueRow {
  id: string;
  tracked_card_id: string;
  credit_id: string;
  period_start: string;
  period_end: string;
  user_value_cents: number;
  used: number;
}

interface CreditSyncCard {
  id: string;
  preset_id: string;
  annual_renewal_date: string;
  certificate_expiry_date: string;
  free_night_redemption_value_cents: number;
}

interface LegacyCreditValueRow {
  credit_id: string;
  user_value_cents: number;
}

interface UpdateCreditValueInput {
  cardId: string;
  creditId: string;
  periodStart: string;
  used: boolean;
  userValue: number;
}

let database: Database.Database | undefined;

export function listTrackedCards(userId: string): TrackedCard[] {
  const rows = readTrackedCardRows(userId);

  return rows.map(toTrackedCard);
}

export function addTrackedCard(userId: string, input: AddTrackedCardInput): void {
  const cardId = randomUUID();

  runWrite(() => {
    getDatabase()
      .prepare(
        `INSERT INTO tracked_cards (
          id,
          user_id,
          preset_id,
          nickname,
          annual_renewal_date,
          certificate_expiry_date,
          free_night_used,
          free_night_redemption_value_cents
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        cardId,
        userId,
        input.presetId,
        input.nickname,
        input.annualRenewalDate,
        input.certificateExpiryDate,
        input.freeNightUsed ? 1 : 0,
        toCents(input.freeNightUsed ? input.freeNightRedemptionValue : 0)
      );
  });

  initializeCardCreditValues(userId, cardId);
}

export function updateFreeNightUsed(
  userId: string,
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
        WHERE id = ? AND user_id = ?`
      )
      .run(
        freeNightUsed ? 1 : 0,
        freeNightUsed ? 1 : 0,
        toCents(freeNightUsed ? freeNightRedemptionValue : 0),
        cardId,
        userId
      );
  });
}

export function updateTrackedCard(userId: string, input: UpdateTrackedCardInput): void {
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
        WHERE id = ? AND user_id = ?`
      )
      .run(
        input.presetId,
        input.nickname,
        input.annualRenewalDate,
        input.certificateExpiryDate,
        input.freeNightUsed ? 1 : 0,
        toCents(input.freeNightUsed ? input.freeNightRedemptionValue : 0),
        input.id,
        userId
      );
  });
}

export function deleteTrackedCard(userId: string, cardId: string): void {
  runWrite(() => {
    getDatabase()
      .prepare('DELETE FROM tracked_card_credit_periods WHERE tracked_card_id = ? AND user_id = ?')
      .run(cardId, userId);
    getDatabase()
      .prepare('DELETE FROM tracked_card_credit_values WHERE tracked_card_id = ? AND user_id = ?')
      .run(cardId, userId);
    getDatabase()
      .prepare('DELETE FROM tracked_cards WHERE id = ? AND user_id = ?')
      .run(cardId, userId);
  });
}

export function rollTrackedCard(userId: string, cardId: string): boolean {
  const card = getTrackedCardRow(userId, cardId);

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
        WHERE id = ? AND user_id = ?`
      )
      .run(
        getNextAnnualDate(card.annual_renewal_date),
        getNextAnnualDate(card.certificate_expiry_date),
        cardId,
        userId
      );
  });

  return true;
}

export function isKnownCardPreset(presetId: string): boolean {
  return cardPresets.some((preset) => preset.id === presetId);
}

export function initializeTrackedCardCreditValues(userId: string): number {
  const cards = getDatabase()
    .prepare(
      `SELECT id,
        preset_id,
        annual_renewal_date,
        certificate_expiry_date,
        free_night_redemption_value_cents
      FROM tracked_cards
      WHERE user_id = ?`
    )
    .all(userId) as CreditSyncCard[];

  return runWriteWithCount(() =>
    cards.reduce((total, card) => total + insertMissingCreditValues(userId, card), 0)
  );
}

export function rollActiveCreditPeriods(userId: string): number {
  return initializeTrackedCardCreditValues(userId);
}

export function updateCreditValue(userId: string, input: UpdateCreditValueInput): boolean {
  const card = getTrackedCardRow(userId, input.cardId);
  const definition = card ? findCreditDefinition(card.preset_id, input.creditId) : undefined;

  if (!card || !definition) {
    return false;
  }

  initializeCardCreditValues(userId, input.cardId);

  const storedUsed = definition.requiresManualUse && input.used ? 1 : 0;
  const result = runWriteWithCount(
    () =>
      getDatabase()
        .prepare(
          `UPDATE tracked_card_credit_periods
        SET user_value_cents = ?,
          used = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE tracked_card_id = ? AND user_id = ? AND credit_id = ? AND period_start = ?`
        )
        .run(
          toCents(input.userValue),
          storedUsed,
          input.cardId,
          userId,
          input.creditId,
          input.periodStart
        ).changes
  );

  return result > 0;
}

function readTrackedCardRows(userId: string): TrackedCardRow[] {
  return getDatabase()
    .prepare(
      `SELECT id,
        user_id,
        preset_id,
        nickname,
        annual_renewal_date,
        certificate_expiry_date,
        free_night_used,
        free_night_redemption_value_cents,
        created_at
      FROM tracked_cards
      WHERE user_id = ?
      ORDER BY date(certificate_expiry_date) ASC, datetime(created_at) DESC`
    )
    .all(userId) as TrackedCardRow[];
}

function getTrackedCardRow(userId: string, cardId: string): TrackedCardRow | undefined {
  const row = getDatabase()
    .prepare(
      `SELECT id,
        user_id,
        preset_id,
        nickname,
        annual_renewal_date,
        certificate_expiry_date,
        free_night_used,
        free_night_redemption_value_cents,
        created_at
      FROM tracked_cards
      WHERE id = ? AND user_id = ?`
    )
    .get(cardId, userId) as TrackedCardRow | undefined;

  return row;
}

function getDatabase(): Database.Database {
  if (!database || !existsSync(databasePath)) {
    closeDatabase();
    ensureDatabaseDirectory();
    database = new Database(databasePath);
    ensureSchema(database);
  }

  return database;
}

function ensureSchema(openDatabase: Database.Database): void {
  openDatabase.exec(`
      CREATE TABLE IF NOT EXISTS tracked_cards (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        preset_id TEXT NOT NULL,
        nickname TEXT NOT NULL,
        annual_renewal_date TEXT NOT NULL,
        certificate_expiry_date TEXT NOT NULL,
        free_night_used INTEGER NOT NULL DEFAULT 0,
        free_night_redemption_value_cents INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

  openDatabase.exec(`
      CREATE TABLE IF NOT EXISTS tracked_card_credit_periods (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tracked_card_id TEXT NOT NULL,
        credit_id TEXT NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        user_value_cents INTEGER NOT NULL DEFAULT 0,
        used INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tracked_card_id, credit_id, period_start)
      )
    `);

  openDatabase.exec(`
      CREATE TABLE IF NOT EXISTS tracked_card_credit_values (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tracked_card_id TEXT NOT NULL,
        credit_id TEXT NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        user_value_cents INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tracked_card_id, credit_id)
      )
    `);

  const columns = openDatabase
    .prepare('PRAGMA table_info(tracked_cards)')
    .all() as TableColumnRow[];

  if (!columns.some((column) => column.name === 'user_id')) {
    openDatabase.exec('DELETE FROM tracked_cards');
    openDatabase.exec('ALTER TABLE tracked_cards ADD COLUMN user_id TEXT NOT NULL DEFAULT ""');
  }

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

function runWriteWithCount(write: () => number): number {
  try {
    return write();
  } catch {
    closeDatabase();
    return write();
  }
}

function closeDatabase(): void {
  database?.close();
  database = undefined;
}

function toTrackedCard(row: TrackedCardRow): TrackedCard {
  const preset = findCardPreset(row.preset_id);
  const creditValuations = readCreditValuations(row, preset);
  const annualizedCreditValue = creditValuations.reduce(
    (total, credit) => total + credit.annualizedValue,
    0
  );

  return {
    id: row.id,
    userId: row.user_id,
    presetId: row.preset_id,
    nickname: row.nickname,
    annualRenewalDate: row.annual_renewal_date,
    certificateExpiryDate: row.certificate_expiry_date,
    freeNightUsed: row.free_night_used === 1,
    freeNightRedemptionValue: fromCents(row.free_night_redemption_value_cents),
    creditValuations,
    annualFee: preset.annualFee,
    annualizedCreditValue,
    netValue: annualizedCreditValue - preset.annualFee,
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

function getCreditPeriodForCard(
  credit: CreditDefinition,
  card: Pick<TrackedCardRow, 'annual_renewal_date' | 'certificate_expiry_date'>
) {
  if (credit.id === 'certificate') {
    return {
      start: card.annual_renewal_date,
      end: card.certificate_expiry_date,
      label: 'Certificate'
    };
  }

  return getCreditPeriod(credit.cadence);
}

function initializeCardCreditValues(userId: string, cardId: string): number {
  const card = getDatabase()
    .prepare(
      `SELECT id,
        preset_id,
        annual_renewal_date,
        certificate_expiry_date,
        free_night_redemption_value_cents
      FROM tracked_cards
      WHERE id = ? AND user_id = ?`
    )
    .get(cardId, userId) as CreditSyncCard | undefined;

  if (!card) {
    return 0;
  }

  return runWriteWithCount(() => insertMissingCreditValues(userId, card));
}

function insertMissingCreditValues(userId: string, card: CreditSyncCard): number {
  const preset = findCardPreset(card.preset_id);
  const insertStatement = getDatabase().prepare(
    `INSERT OR IGNORE INTO tracked_card_credit_periods (
      id,
      user_id,
      tracked_card_id,
      credit_id,
      period_start,
      period_end,
      user_value_cents,
      used
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  return preset.credits.reduce((total, credit) => {
    const period = getCreditPeriodForCard(credit, card);
    const defaultValue = getDefaultCreditValueCents(card, credit);

    return (
      total +
      insertStatement.run(
        randomUUID(),
        userId,
        card.id,
        credit.id,
        period.start,
        period.end,
        defaultValue,
        0
      ).changes
    );
  }, 0);
}

function readCreditValuations(card: TrackedCardRow, preset: CardPreset): CreditValuation[] {
  const rows = getDatabase()
    .prepare(
      `SELECT id,
        tracked_card_id,
        credit_id,
        period_start,
        period_end,
        user_value_cents,
        used
      FROM tracked_card_credit_periods
      WHERE tracked_card_id = ?`
    )
    .all(card.id) as CreditValueRow[];

  return preset.credits.map((credit) => {
    const period = getCreditPeriodForCard(credit, card);
    const valueRow = rows.find(
      (row) => row.credit_id === credit.id && row.period_start === period.start
    );
    const userValue = fromCents(valueRow?.user_value_cents ?? toCents(credit.faceValue));
    const periodStart = valueRow?.period_start ?? period.start;
    const periodEnd = valueRow?.period_end ?? period.end;
    const expiresInDays = getDaysUntilDate(periodEnd);
    const isExpired = expiresInDays !== undefined && expiresInDays < 0;
    const used = credit.requiresManualUse && valueRow?.used === 1;
    const annualizedValue = getValuationAnnualizedValue(credit, userValue, used, isExpired);

    return {
      creditId: credit.id,
      name: credit.name,
      cadence: credit.cadence,
      cadenceLabel: getCreditCadenceLabel(credit.cadence),
      periodLabel: period.label,
      periodStart,
      periodEnd,
      faceValue: credit.faceValue,
      userValue,
      annualizedValue,
      description: credit.description,
      requiresManualUse: credit.requiresManualUse,
      used,
      expiresInDays,
      isExpired,
      needsAttention: getNeedsAttention(credit, used, expiresInDays)
    };
  });
}

function getDefaultCreditValueCents(card: CreditSyncCard, credit: CreditDefinition): number {
  const previousValue = getPreviousCreditValueCents(card, credit);

  if (previousValue !== undefined) {
    return previousValue;
  }

  const hasLegacyCertificateValue =
    credit.id === 'certificate' && card.free_night_redemption_value_cents > 0;

  if (hasLegacyCertificateValue) {
    return card.free_night_redemption_value_cents;
  }

  return toCents(credit.faceValue);
}

function getPreviousCreditValueCents(
  card: CreditSyncCard,
  credit: CreditDefinition
): number | undefined {
  const existingPeriod = getDatabase()
    .prepare(
      `SELECT user_value_cents
      FROM tracked_card_credit_periods
      WHERE tracked_card_id = ? AND credit_id = ?
      ORDER BY date(period_start) DESC
      LIMIT 1`
    )
    .get(card.id, credit.id) as Pick<CreditValueRow, 'user_value_cents'> | undefined;

  if (existingPeriod) {
    return existingPeriod.user_value_cents;
  }

  const legacyValue = getDatabase()
    .prepare(
      `SELECT user_value_cents
      FROM tracked_card_credit_values
      WHERE tracked_card_id = ? AND credit_id = ?
      LIMIT 1`
    )
    .get(card.id, credit.id) as LegacyCreditValueRow | undefined;

  return legacyValue?.user_value_cents;
}

function getValuationAnnualizedValue(
  credit: CreditDefinition,
  userValue: number,
  used: boolean,
  isExpired: boolean
): number {
  const realizedValue = credit.requiresManualUse && isExpired && !used ? 0 : userValue;

  return getAnnualizedCreditValue(credit.cadence, realizedValue);
}

function getNeedsAttention(
  credit: CreditDefinition,
  used: boolean,
  expiresInDays: number | undefined
): boolean {
  return credit.requiresManualUse && !used && expiresInDays !== undefined && expiresInDays <= 60;
}

function findCardPreset(presetId: string): CardPreset {
  return cardPresets.find((preset) => preset.id === presetId) ?? cardPresets[0];
}

function findCreditDefinition(presetId: string, creditId: string): CreditDefinition | undefined {
  return findCardPreset(presetId).credits.find((credit) => credit.id === creditId);
}
