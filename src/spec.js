const UNSUPPORTED_PREFIXES = [
  'file:',
  'git:',
  'git+',
  'github:',
  'http:',
  'https:',
  'link:',
  'workspace:'
];

export function parsePackageSpec(input) {
  const value = String(input ?? '').trim();
  if (!value) {
    throw new Error('Package name is required.');
  }

  let name = value;
  let range = 'latest';

  if (value.startsWith('@')) {
    const slash = value.indexOf('/');
    if (slash === -1) {
      throw new Error(`Invalid scoped package: ${value}`);
    }

    const separator = value.lastIndexOf('@');
    if (separator > slash) {
      name = value.slice(0, separator);
      range = value.slice(separator + 1) || 'latest';
    }
  } else {
    const separator = value.lastIndexOf('@');
    if (separator > 0) {
      name = value.slice(0, separator);
      range = value.slice(separator + 1) || 'latest';
    }
  }

  if (!name || name.includes(' ')) {
    throw new Error(`Invalid package name: ${name || value}`);
  }

  return { name, range };
}

export function normalizeDependency(name, rawRange) {
  const range = String(rawRange ?? '').trim() || 'latest';

  if (range.startsWith('npm:')) {
    const alias = parsePackageSpec(range.slice(4));
    return {
      name: alias.name,
      range: alias.range,
      alias: name
    };
  }

  if (UNSUPPORTED_PREFIXES.some((prefix) => range.startsWith(prefix))) {
    return null;
  }

  return { name, range, alias: null };
}
