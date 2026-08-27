# Mercado Pago payment index migration

The application now creates provider identifiers as absent fields and uses partial unique indexes. Deploy the application change before running this one-time Atlas operation. Do not run it against production from a local shell.

1. In MongoDB Atlas, open the production cluster's Data Explorer, select the application database and the `payments` collection, and confirm the existing index names with `getIndexes()`.
2. During a short billing-write maintenance window, stop checkout/webhook/reconciliation writes. Keep reads available if needed.
3. Drop the old sparse indexes (use the actual names returned in step 1; the default names are shown below):

```javascript
db.payments.dropIndex('mpPaymentId_1')
db.payments.dropIndex('preferenceId_1')
```

4. Create the replacement indexes, preserving uniqueness only for non-empty strings:

```javascript
db.payments.createIndex(
  { mpPaymentId: 1 },
  { name: 'mpPaymentId_nonempty_unique', unique: true,
    partialFilterExpression: { mpPaymentId: { $type: 'string', $gt: '' } } }
)
db.payments.createIndex(
  { preferenceId: 1 },
  { name: 'preferenceId_nonempty_unique', unique: true,
    partialFilterExpression: { preferenceId: { $type: 'string', $gt: '' } } }
)
```

5. Verify both new indexes with `getIndexes()`, resume writes, and monitor checkout/reconciliation errors. The existing `{ businessId: 1, attemptReference: 1 }` unique index is not changed.

If duplicate non-empty provider IDs are reported, stop and investigate before creating the replacement indexes; do not delete payment history to force the migration through.
