import Stripe from 'stripe';

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  const stripe = new Stripe(key, { apiVersion: '2023-10-16' });
  return stripe;
}

