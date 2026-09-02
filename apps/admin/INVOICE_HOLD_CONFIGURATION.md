# Full-online invoice inventory hold

The server requires both settings before sending an invoice:

- `SIMPLOTEL_INVOICE_HOLD_VALUE`: a positive safe whole number, written as decimal digits.
- `SIMPLOTEL_INVOICE_HOLD_UNIT`: exactly `MINUTES`, `HOURS`, or `DAYS` (case-sensitive).

The intended production/test configuration is explicitly:

```dotenv
SIMPLOTEL_INVOICE_HOLD_VALUE=30
SIMPLOTEL_INVOICE_HOLD_UNIT=MINUTES
```

This supplies `holdInventory: { enabled: true, value: 30, unit: "MINUTES" }`.
There is no implicit runtime default. Missing, zero, negative, fractional,
whitespace-padded, unsafe-integer, or invalid settings fail closed before
availability or invoice requests. The old `SIMPLOTEL_INVOICE_HOLD_HOURS` setting
is no longer read; replace it with both new settings when configuring the server.

Simplotel has confirmed positive whole numbers with these three units, including
`1 HOURS` and `30 MINUTES`. Although Simplotel falls back to the property's default
for values at or below zero, this application deliberately rejects those values.
Quote-expiry reminder emails are sent only for holds of at least two hours;
do not expect a reminder email for the intended 30-minute hold.

It is not a mobile input and is not returned in preparation metadata.
It does not enable execution: `SIMPLOTEL_BOOKING_ENABLED` must remain false
until separately authorized. No environment files are changed by this feature.

Full online payment calls /send-invoice directly, never /book. The full freshly
validated total is advanceAmount, and advancePercentage is 100.
A successful response creates the invoice/payment link, but the booking remains
UNCONFIRMED and payment remains PAYMENT_PENDING. The link is valid only for the
inventory hold duration. Confirmation requires successful payment.

No payment-status polling or confirmation event is inferred. The app stays pending
until a separately approved authoritative payment-status integration exists.
The isolated direct /book path and its disabled flag are unchanged.
