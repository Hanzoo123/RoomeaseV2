// Same rules as the PHP version of RoomEase (includes/core/validation.php).

export const PASSWORD_RULES = [
  { label: '8 or more characters', test: (value) => value.length >= 8 },
  { label: 'An uppercase letter', test: (value) => /\p{Lu}/u.test(value) },
  { label: 'A lowercase letter', test: (value) => /\p{Ll}/u.test(value) },
  { label: 'A number', test: (value) => /\d/.test(value) },
  { label: 'A symbol (! @ # ?)', test: (value) => /[^\p{L}\p{N}]/u.test(value) },
]

export function passwordIsStrong(value) {
  return PASSWORD_RULES.every((rule) => rule.test(value))
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email) {
  return EMAIL_PATTERN.test(email.trim())
}

// Philippine mobile numbers: 11 digits starting with 09, spaces and dashes allowed.
export function validatePhone(phone) {
  return /^[0-9\-\s]+$/.test(phone) && /^09\d{9}$/.test(phone.replace(/\D/g, ''))
}
