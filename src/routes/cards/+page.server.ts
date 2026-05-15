import { fail } from '@sveltejs/kit';

import { cardPresets } from '$lib/data/card-presets';
import {
  addTrackedCard,
  deleteTrackedCard,
  isKnownCardPreset,
  listTrackedCards,
  rollTrackedCard,
  updateFreeNightUsed,
  updateTrackedCard
} from '$lib/server/cards-db';

import type { Actions, PageServerLoad } from './$types';

const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = () => ({
  cardPresets,
  trackedCards: listTrackedCards()
});

export const actions: Actions = {
  addCard: async ({ request }) => {
    const formData = await request.formData();
    const presetId = getStringField(formData, 'presetId');
    const nickname = getStringField(formData, 'nickname').trim();
    const annualRenewalDate = getStringField(formData, 'annualRenewalDate');
    const certificateExpiryDate = getStringField(formData, 'certificateExpiryDate');
    const freeNightUsed = formData.get('freeNightUsed') === 'on';
    const freeNightRedemptionValue = getMoneyField(formData, 'freeNightRedemptionValue');

    if (!isKnownCardPreset(presetId)) {
      return fail(400, { message: 'Choose a supported card.' });
    }

    if (!nickname) {
      return fail(400, { message: 'Add a nickname for this card.' });
    }

    if (!isDateInput(annualRenewalDate) || !isDateInput(certificateExpiryDate)) {
      return fail(400, { message: 'Use valid dates for renewal and certificate expiry.' });
    }

    if (freeNightRedemptionValue === undefined) {
      return fail(400, { message: 'Use a valid redeemed value.' });
    }

    addTrackedCard({
      presetId,
      nickname,
      annualRenewalDate,
      certificateExpiryDate,
      freeNightUsed,
      freeNightRedemptionValue
    });

    return { message: 'Card added.' };
  },
  toggleFreeNight: async ({ request }) => {
    const formData = await request.formData();
    const cardId = getStringField(formData, 'cardId');
    const freeNightUsed = formData.get('freeNightUsed') === 'true';
    const freeNightRedemptionValue = getMoneyField(formData, 'freeNightRedemptionValue');

    if (!cardId) {
      return fail(400, { message: 'Choose a card to update.' });
    }

    if (freeNightRedemptionValue === undefined) {
      return fail(400, { message: 'Use a valid redeemed value.' });
    }

    updateFreeNightUsed(cardId, freeNightUsed, freeNightRedemptionValue);

    return { message: 'Free night status updated.' };
  },
  editCard: async ({ request }) => {
    const formData = await request.formData();
    const cardId = getStringField(formData, 'cardId');
    const presetId = getStringField(formData, 'presetId');
    const nickname = getStringField(formData, 'nickname').trim();
    const annualRenewalDate = getStringField(formData, 'annualRenewalDate');
    const certificateExpiryDate = getStringField(formData, 'certificateExpiryDate');
    const freeNightUsed = formData.get('freeNightUsed') === 'on';
    const freeNightRedemptionValue = getMoneyField(formData, 'freeNightRedemptionValue');

    if (!cardId) {
      return fail(400, { message: 'Choose a card to edit.' });
    }

    if (!isKnownCardPreset(presetId)) {
      return fail(400, { message: 'Choose a supported card.' });
    }

    if (!nickname) {
      return fail(400, { message: 'Add a nickname for this card.' });
    }

    if (!isDateInput(annualRenewalDate) || !isDateInput(certificateExpiryDate)) {
      return fail(400, { message: 'Use valid dates for renewal and certificate expiry.' });
    }

    if (freeNightRedemptionValue === undefined) {
      return fail(400, { message: 'Use a valid redeemed value.' });
    }

    updateTrackedCard({
      id: cardId,
      presetId,
      nickname,
      annualRenewalDate,
      certificateExpiryDate,
      freeNightUsed,
      freeNightRedemptionValue
    });

    return { message: 'Card updated.' };
  },
  deleteCard: async ({ request }) => {
    const formData = await request.formData();
    const cardId = getStringField(formData, 'cardId');

    if (!cardId) {
      return fail(400, { message: 'Choose a card to delete.' });
    }

    deleteTrackedCard(cardId);

    return { message: 'Card deleted.' };
  },
  rollCard: async ({ request }) => {
    const formData = await request.formData();
    const cardId = getStringField(formData, 'cardId');

    if (!cardId) {
      return fail(400, { message: 'Choose a card to roll.' });
    }

    if (!rollTrackedCard(cardId)) {
      return fail(400, { message: 'This card is not ready to roll yet.' });
    }

    return { message: 'Card rolled to the next cycle.' };
  }
};

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
