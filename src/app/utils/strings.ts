export function capitalizeFirstCharacter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function stripTimeFromIsoDateTimeString(isoDateTime: string) {
  return isoDateTime.slice(0, 10);
}

export function formatArrayAsCommaSeparatedString(array: string[]) {
  const formatter = new Intl.ListFormat('pt-br', {
    style: 'long',
    type: 'conjunction',
  });

  return formatter.format(array);
}

export function formatIdentifierAsCpf(
  identifier: string,
  options: { maskIdentifier: boolean } = {
    maskIdentifier: false,
  },
) {
  if (identifier.length !== 11) {
    if (options.maskIdentifier) {
      return '•••.•••.•••-••';
    } else {
      return identifier;
    }
  }

  let replacer: string;

  if (options.maskIdentifier) {
    replacer = '•••.$2.$3-••';
  } else {
    replacer = '$1.$2.$3-$4';
  }

  return identifier.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, replacer);
}
