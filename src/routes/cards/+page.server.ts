import { fail, redirect } from '@sveltejs/kit';

import { cardPresets } from '$lib/data/card-presets';
import { logInfo, logWarn } from '$lib/server/logger';
import {
  addTrackedCard,
  deleteTrackedCard,
  initializeTrackedCardCreditValues,
  isKnownCardPreset,
  listTrackedCards,
  rollActiveCreditPeriods,
  rollTrackedCard,
  updateCreditValue,
  updateFreeNightUsed,
  updateTrackedCard
} from '$lib/server/cards-db';

import type { Actions, PageServerLoad } from './$types';

const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = ({ locals }) => {
  const userId = requireUserId(locals);
  const initializedCreditCount = initializeTrackedCardCreditValues(userId);
  const rolledCreditCount = rollActiveCreditPeriods(userId);
  const trackedCards = listTrackedCards(userId);

  if (initializedCreditCount > 0) {
    logInfo('card_credit_values_initialized', {
      creditCount: initializedCreditCount,
      userId
    });
  }

  if (rolledCreditCount > 0) {
    logInfo('card_credit_values_auto_rolled', {
      creditCount: rolledCreditCount,
      userId
    });
  }

  logInfo('cards_loaded', {
    cardCount: trackedCards.length,
    userId
  });

  return {
    cardPresets,
    trackedCards
  };
};

export const actions: Actions = {
  addCard: async ({ locals, request }) => {
    const userId = requireUserId(locals);
    const formData = await request.formData();
    const presetId = getStringField(formData, 'presetId');
    const nickname = getStringField(formData, 'nickname').trim();
    const annualRenewalDate = getStringField(formData, 'annualRenewalDate');
    const certificateExpiryDate = getStringField(formData, 'certificateExpiryDate');
    const freeNightUsed = formData.get('freeNightUsed') === 'on';
    const freeNightRedemptionValue = getMoneyField(formData, 'freeNightRedemptionValue');

    if (!isKnownCardPreset(presetId)) {
      logCardValidationFailure('addCard', userId, 'unknown_preset', { presetId });
      return fail(400, { message: 'Choose a supported card.' });
    }

    if (!nickname) {
      logCardValidationFailure('addCard', userId, 'missing_nickname');
      return fail(400, { message: 'Add a nickname for this card.' });
    }

    if (!isDateInput(annualRenewalDate) || !isDateInput(certificateExpiryDate)) {
      logCardValidationFailure('addCard', userId, 'invalid_dates');
      return fail(400, { message: 'Use valid dates for renewal and certificate expiry.' });
    }

    if (freeNightRedemptionValue === undefined) {
      logCardValidationFailure('addCard', userId, 'invalid_redemption_value');
      return fail(400, { message: 'Use a valid redeemed value.' });
    }

    addTrackedCard(userId, {
      presetId,
      nickname,
      annualRenewalDate,
      certificateExpiryDate,
      freeNightUsed,
      freeNightRedemptionValue
    });

    logInfo('card_added', {
      freeNightUsed,
      presetId,
      userId
    });

    return { message: 'Card added.' };
  },
  toggleFreeNight: async ({ locals, request }) => {
    const userId = requireUserId(locals);
    const formData = await request.formData();
    const cardId = getStringField(formData, 'cardId');
    const freeNightUsed = formData.get('freeNightUsed') === 'true';
    const freeNightRedemptionValue = getMoneyField(formData, 'freeNightRedemptionValue');

    if (!cardId) {
      logCardValidationFailure('toggleFreeNight', userId, 'missing_card_id');
      return fail(400, { message: 'Choose a card to update.' });
    }

    if (freeNightRedemptionValue === undefined) {
      logCardValidationFailure('toggleFreeNight', userId, 'invalid_redemption_value', { cardId });
      return fail(400, { message: 'Use a valid redeemed value.' });
    }

    updateFreeNightUsed(userId, cardId, freeNightUsed, freeNightRedemptionValue);

    logInfo('card_free_night_toggled', {
      cardId,
      freeNightUsed,
      userId
    });

    return { message: 'Free night status updated.' };
  },
  updateCreditValue: async ({ locals, request }) => {
    const userId = requireUserId(locals);
    const formData = await request.formData();
    const cardId = getStringField(formData, 'cardId');
    const creditId = getStringField(formData, 'creditId');
    const periodStart = getStringField(formData, 'periodStart');
    const userValue = getMoneyField(formData, 'userValue');
    const used = formData.get('used') === 'true';

    if (!cardId || !creditId || !periodStart) {
      logCardValidationFailure('updateCreditValue', userId, 'missing_credit_identity', {
        cardId,
        creditId,
        periodStart
      });
      return fail(400, { message: 'Choose a credit to update.' });
    }

    if (userValue === undefined) {
      logCardValidationFailure('updateCreditValue', userId, 'invalid_credit_value', {
        cardId,
        creditId
      });
      return fail(400, { message: 'Use a finite non-negative credit value.' });
    }

    if (!updateCreditValue(userId, { cardId, creditId, periodStart, used, userValue })) {
      logCardValidationFailure('updateCreditValue', userId, 'credit_not_found_for_card', {
        cardId,
        creditId,
        periodStart
      });
      return fail(404, { message: 'That credit is not available for this card.' });
    }

    logInfo('card_credit_value_updated', {
      cardId,
      creditId,
      periodStart,
      used,
      userId,
      userValue
    });

    return { message: 'Credit value updated.' };
  },
  editCard: async ({ locals, request }) => {
    const userId = requireUserId(locals);
    const formData = await request.formData();
    const cardId = getStringField(formData, 'cardId');
    const presetId = getStringField(formData, 'presetId');
    const nickname = getStringField(formData, 'nickname').trim();
    const annualRenewalDate = getStringField(formData, 'annualRenewalDate');
    const certificateExpiryDate = getStringField(formData, 'certificateExpiryDate');
    const freeNightUsed = formData.get('freeNightUsed') === 'on';
    const freeNightRedemptionValue = getMoneyField(formData, 'freeNightRedemptionValue');

    if (!cardId) {
      logCardValidationFailure('editCard', userId, 'missing_card_id');
      return fail(400, { message: 'Choose a card to edit.' });
    }

    if (!isKnownCardPreset(presetId)) {
      logCardValidationFailure('editCard', userId, 'unknown_preset', { cardId, presetId });
      return fail(400, { message: 'Choose a supported card.' });
    }

    if (!nickname) {
      logCardValidationFailure('editCard', userId, 'missing_nickname', { cardId });
      return fail(400, { message: 'Add a nickname for this card.' });
    }

    if (!isDateInput(annualRenewalDate) || !isDateInput(certificateExpiryDate)) {
      logCardValidationFailure('editCard', userId, 'invalid_dates', { cardId });
      return fail(400, { message: 'Use valid dates for renewal and certificate expiry.' });
    }

    if (freeNightRedemptionValue === undefined) {
      logCardValidationFailure('editCard', userId, 'invalid_redemption_value', { cardId });
      return fail(400, { message: 'Use a valid redeemed value.' });
    }

    updateTrackedCard(userId, {
      id: cardId,
      presetId,
      nickname,
      annualRenewalDate,
      certificateExpiryDate,
      freeNightUsed,
      freeNightRedemptionValue
    });

    logInfo('card_updated', {
      cardId,
      freeNightUsed,
      presetId,
      userId
    });

    return { message: 'Card updated.' };
  },
  deleteCard: async ({ locals, request }) => {
    const userId = requireUserId(locals);
    const formData = await request.formData();
    const cardId = getStringField(formData, 'cardId');

    if (!cardId) {
      logCardValidationFailure('deleteCard', userId, 'missing_card_id');
      return fail(400, { message: 'Choose a card to delete.' });
    }

    deleteTrackedCard(userId, cardId);

    logInfo('card_deleted', {
      cardId,
      userId
    });

    return { message: 'Card deleted.' };
  },
  rollCard: async ({ locals, request }) => {
    const userId = requireUserId(locals);
    const formData = await request.formData();
    const cardId = getStringField(formData, 'cardId');

    if (!cardId) {
      logCardValidationFailure('rollCard', userId, 'missing_card_id');
      return fail(400, { message: 'Choose a card to roll.' });
    }

    if (!rollTrackedCard(userId, cardId)) {
      logWarn('card_roll_rejected', {
        cardId,
        reason: 'not_eligible_or_not_found',
        userId
      });
      return fail(400, { message: 'This card is not ready to roll yet.' });
    }

    logInfo('card_rolled', {
      cardId,
      userId
    });

    return { message: 'Card rolled to the next cycle.' };
  }
};

function requireUserId(locals: App.Locals): string {
  if (!locals.user) {
    logWarn('cards_auth_required', {
      reason: 'missing_user'
    });
    redirect(303, '/login?redirectTo=/cards');
  }

  return locals.user.id;
}

function logCardValidationFailure(
  action: string,
  userId: string,
  reason: string,
  fields: Record<string, string | undefined> = {}
): void {
  logWarn('card_action_validation_failed', {
    action,
    reason,
    userId,
    ...fields
  });
}

function getStringField(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  return typeof value === 'string' ? value : '';
}

function isDateInput(value: string): boolean {
  return dateInputPattern.test(value);
}

function getMoneyField(formData: FormData, fieldName: string): number | undefined {
  const rawValue = getStringField(formData, fieldName);

  if (!rawValue) {
    return 0;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return value;
}
