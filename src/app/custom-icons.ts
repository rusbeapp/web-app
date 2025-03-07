export const getCustomIconPath = (kebabCaseIconName: string) =>
  `/assets/elements/custom-icons/${kebabCaseIconName}.svg`;

export const CUSTOM_ICON_TO_PATH: Record<string, string> = {
  ['customCash']: getCustomIconPath('custom-cash'),
  ['customCreditCard']: getCustomIconPath('custom-credit-card'),
  ['customDebitCard']: getCustomIconPath('custom-debit-card'),
};
