export type EntitlementReadModel = {
  plan: 'basic' | 'premium' | 'enterprise';
  label: string;
  automaticMessaging: {
    available: boolean;
    limit: number;
    accepted: number;
    uncertain: number;
    remaining: number;
    period: string;
  };
};

export type AutomaticMessagingPresentation = {
  state: 'unavailable' | 'accepted' | 'approaching' | 'reached' | 'uncertain' | 'custom';
  label: string;
  detail: string;
  upgrade: boolean;
};

export function presentAutomaticMessaging(entitlement: EntitlementReadModel): AutomaticMessagingPresentation {
  const usage = entitlement.automaticMessaging;
  if (entitlement.plan === 'enterprise') {
    return { state: 'custom', label: 'Enterprise', detail: 'Límites personalizados. Contactá soporte para revisar tu asignación.', upgrade: false };
  }
  if (!usage.available) {
    return { state: 'unavailable', label: 'No disponible', detail: 'La mensajería automática requiere un plan Premium.', upgrade: true };
  }
  if (usage.uncertain > 0) {
    return { state: 'uncertain', label: 'Revisión pendiente', detail: `${usage.uncertain} entrega${usage.uncertain === 1 ? '' : 's'} necesita${usage.uncertain === 1 ? '' : 'n'} confirmación. No cuenta${usage.uncertain === 1 ? '' : 'n'} como aceptada${usage.uncertain === 1 ? '' : 's'}.`, upgrade: false };
  }
  if (usage.remaining <= 0) {
    return { state: 'reached', label: 'Límite alcanzado', detail: `Usaste ${usage.accepted} de ${usage.limit} mensajes automáticos en ${usage.period}.`, upgrade: false };
  }
  if (usage.limit > 0 && usage.remaining / usage.limit <= 0.2) {
    return { state: 'approaching', label: 'Cerca del límite', detail: `Quedan ${usage.remaining} de ${usage.limit} mensajes automáticos en ${usage.period}.`, upgrade: false };
  }
  return { state: 'accepted', label: 'Disponible', detail: `${usage.accepted} de ${usage.limit} mensajes automáticos usados en ${usage.period}.`, upgrade: false };
}
