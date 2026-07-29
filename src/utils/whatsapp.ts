export function cleanWhatsAppNumber(phone?: string | null): string {
  if (!phone) return '923018899771';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = '92' + digits.substring(1);
  }
  return digits || '923018899771';
}

export function validateWhatsAppNumber(phone?: string | null): { isValid: boolean; message?: string } {
  if (!phone || !phone.trim()) {
    return { isValid: false, message: 'WhatsApp number is required.' };
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return { isValid: false, message: 'Please enter a valid phone/WhatsApp number (10-15 digits).' };
  }
  return { isValid: true };
}

export function buildWhatsAppUrl(phone?: string | null, message?: string): string {
  const cleaned = cleanWhatsAppNumber(phone);
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${cleaned}${textParam}`;
}
