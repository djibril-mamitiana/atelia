/** `tel:` link for a phone number typed freely in /admin/settings
 *  ("01 23 45 67 89", "+33 1 23 45 67 89"…): keeps digits and a leading +. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
