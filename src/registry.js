import semver from 'semver';

const DEFAULT_REGISTRY = 'https://registry.npmjs.org';
const ACCEPT = 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*';

export class RegistryClient {
  constructor({ registry = DEFAULT_REGISTRY, timeoutMs = 15000, fetchImpl = fetch } = {}) {
    this.registry = registry.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
    this.fetchImpl = fetchImpl;
    this.packumentCache = new Map();
  }

  async getPackument(name) {
    if (!this.packumentCache.has(name)) {
      this.packumentCache.set(name, this.#fetchPackument(name));
    }
    return this.packumentCache.get(name);
  }

  async resolve(name, range = 'latest') {
    const packument = await this.getPackument(name);
    const version = resolveVersion(packument, range);

    if (!version) {
      throw new Error(`No version of ${name} matches ${range}`);
    }

    const metadata = packument.versions?.[version];
    if (!metadata) {
      throw new Error(`Registry metadata for ${name}@${version} is missing.`);
    }

    return {
      name,
      version,
      metadata,
      modified: packument.modified ?? null
    };
  }

  async #fetchPackument(name) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const encodedName = encodeURIComponent(name);

    try {
      const response = await this.fetchImpl(`${this.registry}/${encodedName}`, {
        headers: {
          accept: ACCEPT,
          'user-agent': 'npm-invoice/0.1.0'
        },
        signal: controller.signal
      });

      if (response.status === 404) {
        throw new Error(`Package not found: ${name}`);
      }
      if (!response.ok) {
        throw new Error(`Registry request failed for ${name}: HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error(`Registry request timed out for ${name}`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

export function resolveVersion(packument, range = 'latest') {
  const versions = Object.keys(packument.versions ?? {});
  if (versions.length === 0) return null;

  if (packument.versions?.[range]) {
    return range;
  }

  const tagged = packument['dist-tags']?.[range];
  if (tagged && packument.versions?.[tagged]) {
    return tagged;
  }

  const validRange = semver.validRange(range, { loose: true });
  if (!validRange) return null;

  return semver.maxSatisfying(versions, validRange, {
    includePrerelease: false,
    loose: true
  });
}
