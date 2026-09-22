const ESC = '\u001b[';

export function renderInvoice(report, { color = true } = {}) {
  const c = createColors(color);
  const t = report.totals;
  const lines = [];

  lines.push('');
  lines.push(c.bold('npm invoice'));
  lines.push(c.dim('─'.repeat(52)));
  lines.push(`${c.dim('requested')}  ${report.requested}`);
  lines.push(`${c.dim('resolved ')}  ${report.resolved}`);
  lines.push('');
  lines.push(`${c.bold('YOU ASKED FOR')}      ${c.green('1 package')}`);
  lines.push(`${c.bold("YOU'RE GETTING")}    ${severity(t.packages, c, `${formatNumber(t.packages)} packages`)}`);
  lines.push('');
  lines.push(c.bold('DEPENDENCY BILL'));
  lines.push(c.dim('─'.repeat(52)));
  lines.push(row('Transitive packages', formatNumber(t.transitivePackages)));
  lines.push(row('Unpacked size', formatBytes(t.unpackedSize)));
  lines.push(row('Files', formatNumber(t.files)));
  lines.push(row('Install scripts', formatNumber(t.installScripts), t.installScripts > 0 ? c.yellow : null));
  lines.push(row('Deprecated packages', formatNumber(t.deprecated), t.deprecated > 0 ? c.yellow : null));
  lines.push(row(`Inactive > ${report.staleDays}d`, formatNumber(t.inactive), t.inactive > 0 ? c.yellow : null));
  lines.push(row('Maximum depth', formatNumber(t.maxDepth)));

  if (t.unsupportedSpecs > 0 || t.unresolved > 0) {
    lines.push('');
    lines.push(c.yellow(`Partial result: ${t.unsupportedSpecs} unsupported specs, ${t.unresolved} unresolved.`));
  }

  lines.push(c.dim('─'.repeat(52)));
  lines.push(c.dim('Peer dependencies are not included because they depend on the target project.'));
  lines.push('');

  return lines.join('\n');
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = value >= 100 || unit === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

function row(label, value, paint = null) {
  const padded = label.padEnd(28, ' ');
  return `${padded}${paint ? paint(value) : value}`;
}

function severity(packages, c, text) {
  if (packages >= 500) return c.red(text);
  if (packages >= 100) return c.yellow(text);
  return c.green(text);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}

function createColors(enabled) {
  const wrap = (code) => (value) => enabled ? `${ESC}${code}m${value}${ESC}0m` : String(value);
  return {
    bold: wrap('1'),
    dim: wrap('2'),
    green: wrap('32'),
    yellow: wrap('33'),
    red: wrap('31')
  };
}
