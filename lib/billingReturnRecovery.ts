export type BillingReturnParams = {
  payment_id?: string;
  external_reference?: string;
  preference_id?: string;
};

export function getBillingReturnReference(params: BillingReturnParams) {
  const paymentId = params.payment_id?.trim();
  const externalReference = params.external_reference?.trim();
  const preferenceId = params.preference_id?.trim();
  if (paymentId) return { kind: 'paymentId' as const, value: paymentId };
  if (externalReference) return { kind: 'attemptReference' as const, value: externalReference };
  if (preferenceId) return { kind: 'preferenceId' as const, value: preferenceId };
  return null;
}

export function returnReconciliationMessage(status: string | undefined, providerStatus?: string) {
  const resolved = providerStatus || status;
  if (resolved === 'approved') return { tone: 'success' as const, title: 'Pago aprobado', text: 'Mercado Pago confirmó el pago y actualizamos tu acceso.' };
  if (resolved === 'pending') return { tone: 'warning' as const, title: 'Pago pendiente', text: 'Mercado Pago todavía lo está procesando. No repitas el pago; podés verificarlo nuevamente desde el historial.' };
  if (resolved === 'rejected' || resolved === 'failure') return { tone: 'error' as const, title: 'Pago rechazado o cancelado', text: 'El pago no habilitó el acceso. Podés intentar otro pago manual o contactar soporte con la referencia.' };
  return { tone: 'error' as const, title: 'No pudimos verificar el pago', text: 'No encontramos una confirmación verificable. Revisá el historial o contactá soporte con la referencia.' };
}
