// lib/whatsapp.ts
export function normalizePhone(phone: string): string {
  // sacamos espacios, guiones, etc.
  return phone.replace(/[^0-9+]/g, '');
}

export function buildWhatsAppMessage(
  type: 'confirm' | 'reject',
  data: {
    clientName: string;
    date: string;
    startTime: string;
    serviceName: string;
  }
) {
  const { clientName, date, startTime, serviceName } = data;

  if (type === 'confirm') {
    return (
      `Hola ${clientName}! 💅\n` +
      `Te confirmo tu turno de *${serviceName}* para el día ${date} a las ${startTime}.\n` +
      `Cualquier cosa avisame por acá.`
    );
  } else {
    return (
      `Hola ${clientName}, ¿cómo estás?\n` +
      `Lamentablemente no puedo tomar el turno de *${serviceName}* el ${date} a las ${startTime}.\n` +
      `Si querés, podemos buscar otro horario.`
    );
  }
}
