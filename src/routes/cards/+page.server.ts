import { fail } from '@sveltejs/kit';

import { cardPresets } from '$lib/data/card-presets';
import {
  addTrackedCard,
  isKnownCardPreset,
  listTrackedCards,
  updateFreeNightUsed
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

    if (!isKnownCardPreset(presetId)) {
      return fail(400, { message: 'Choose a supported card.' });
    }

    if (!nickname) {
      return fail(400, { message: 'Add a nickname for this card.' });
    }

    if (!isDateInput(annualRenewalDate) || !isDateInput(certificateExpiryDate)) {
      return fail(400, { message: 'Use valid dates for renewal and certificate expiry.' });
    }

    addTrackedCard({
      presetId,
      nickname,
      annualRenewalDate,
      certificateExpiryDate,
      freeNightUsed: formData.get('freeNightUsed') === 'on'
    });

    return { message: 'Card added.' };
  },
  toggleFreeNight: async ({ request }) => {
    const formData = await request.formData();
    const cardId = getStringField(formData, 'cardId');
    const freeNightUsed = formData.get('freeNightUsed') === 'true';

    if (!cardId) {
      return fail(400, { message: 'Choose a card to update.' });
    }

    updateFreeNightUsed(cardId, freeNightUsed);

    return { message: 'Free night status updated.' };
  }
};

function getStringField(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  return typeof value === 'string' ? value : '';
}

function isDateInput(value: string): boolean {
  return dateInputPattern.test(value);
}
