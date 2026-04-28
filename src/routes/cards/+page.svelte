<script lang="ts">
  import CreditCardItem from '$lib/components/CreditCardItem.svelte';

  const hyatt = {
    name: 'World of Hyatt Credit Card',
    image: 'https://img.daisyui.com/images/stock/creditcard.webp',
    annualFee: 95,
    benefits: [
      { label: 'Free Night', value: 'Cat 1-4 yearly' },
      { label: 'Elite Status', value: 'Discoverist' },
    ],
  };

  const ihg = {
    name: 'IHG Premier Card',
    image: 'https://img.daisyui.com/images/stock/creditcard.webp',
    annualFee: 99,
    benefits: [
      { label: 'Free Night', value: 'Up to 40k pts' },
      { label: '4th Night Free', value: 'On award stays' },
    ],
  };
</script>

<div class="flex flex-col gap-6">
  <CreditCardItem {...hyatt} />
  <CreditCardItem {...ihg} />
</div>
