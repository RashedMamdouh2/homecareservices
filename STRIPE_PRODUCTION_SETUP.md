# Stripe Production Setup Guide

This guide explains how to set up Stripe payment processing for the Homecare healthcare application.

## Overview

The application supports two payment flows:
1. **Appointment Payments** - Using Stripe Checkout Sessions
2. **Invoice Payments** - Using Stripe Payment Intents

## Frontend Setup

### 1. Install Stripe Dependencies
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Environment Variables
Add to your `.env` file:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 3. Stripe Provider Setup
```tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <Elements stripe={stripePromise}>
      {/* Your app components */}
    </Elements>
  );
}
```

## Backend Setup

### 1. Install Stripe .NET SDK
```bash
dotnet add package Stripe.net
```

### 2. Configure Stripe
```csharp
// In Program.cs
StripeConfiguration.ApiKey = builder.Configuration["Stripe:ApiKey"];
```

### 3. appsettings.json
```json
{
  "Stripe": {
    "ApiKey": "sk_test_your_stripe_secret_key_here",
    "PublishableKey": "pk_test_your_stripe_publishable_key_here"
  }
}
```

## Payment Flows

### Appointment Payments (Checkout Sessions)
- Used for immediate appointment booking payments
- Redirects to Stripe hosted checkout page
- Handles payment confirmation automatically

### Invoice Payments (Payment Intents)
- Used for billing invoices after services
- Integrates with Stripe Elements in your UI
- Provides more control over the payment experience

## Security Considerations

1. **Webhook Verification**: Always verify webhook signatures
2. **Amount Validation**: Double-check amounts on the backend
3. **User Authorization**: Ensure users can only access their own invoices
4. **PCI Compliance**: Stripe handles PCI compliance when using Elements

## Testing

Use Stripe test keys for development:
- Publishable key: `pk_test_...`
- Secret key: `sk_test_...`

Test card numbers:
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`

## Production Deployment

1. Replace test keys with live keys
2. Set up webhooks for payment confirmations
3. Configure proper error handling
4. Test with small amounts first

## API Endpoints

### Payment Controller
- `GET /api/payments/invoices` - Get user invoices
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/generate-bill` - Generate bill (admin)

### Stripe Controller
- `POST /api/stripe` - Create checkout session

## Troubleshooting

1. **Payment fails**: Check Stripe logs in dashboard
2. **Webhook not firing**: Verify webhook endpoint URL
3. **Amount mismatch**: Ensure proper currency conversion (cents)
4. **CORS issues**: Configure CORS policy for Stripe domains