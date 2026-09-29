import { COUNTRY_CODES } from '../../shared/countries.js';

const names = new Intl.DisplayNames(['en'], { type: 'region' });

/** Dropdown options: the code is what gets saved, the name is what people see. */
export const COUNTRIES = COUNTRY_CODES.map((code) => ({ code, name: names.of(code) })).sort(
  (a, b) => a.name.localeCompare(b.name),
);

/** Display name for a stored code; empty for users saved before country existed. */
export function countryName(code) {
  return code ? names.of(code) : '';
}
