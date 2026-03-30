// CNPJ validation
export function validateCNPJ(cnpj) {
  const c = cnpj.replace(/\D/g, "");
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  let sum = 0;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) sum += parseInt(c[i]) * w1[i];
  const d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(c[12]) !== d1) return false;
  sum = 0;
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) sum += parseInt(c[i]) * w2[i];
  const d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(c[13]) === d2;
}

// Date validation - DD/MM/YYYY
export function validateDate(value) {
  if (!value) return null;
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const [, dd, mm, yyyy] = m;
  const day = parseInt(dd), month = parseInt(mm), year = parseInt(yyyy);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  // Check actual date validity
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

// Apply input mask
export function applyMask(rawValue, mask) {
  const digits = rawValue.replace(/\D/g, "");
  let result = "";
  let di = 0;
  for (let mi = 0; mi < mask.length && di < digits.length; mi++) {
    if (mask[mi] === "9") {
      result += digits[di++];
    } else {
      result += mask[mi];
      if (digits[di] === mask[mi]) di++;
    }
  }
  return result;
}

export function isMaskComplete(value, mask) {
  return value && value.length === mask.length;
}

// Format currency
export function formatCurrency(value) {
  const n = parseFloat(value);
  if (isNaN(n)) return "";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Confidence color
export function confidenceColor(c) {
  if (c >= 0.95) return { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" };
  if (c >= 0.80) return { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
  return { text: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
}
