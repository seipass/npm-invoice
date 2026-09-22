import { normalizeDependency } from './spec.js';

export async function analyzePackage(
  rootSpec,
  {
    client,
    concurrency = 12,
    maxPackages = 5000,
    staleDays = 730,
    onProgress = () => {}
  } = {}
) {
  if (!client) throw new Error('A registry client is required.');

  const queue = [{ ...rootSpec, depth: 0, parent: null }];
  const nodes = new Map();
  const unsupported = [];
  const unresolved = [];
  let cursor = 0;
  let active = 0;
  let fatalError = null;

  await new Promise((resolve, reject) => {
    const pump = () => {
      if (fatalError) {
        reject(fatalError);
        return;
      }

      while (active < concurrency && cursor < queue.length) {
        const item = queue[cursor++];
        active++;

        processItem(item)
          .then((children) => {
            queue.push(...children);
          })
          .catch((error) => {
            if (item.depth === 0) {
              fatalError = error;
            } else {
              unresolved.push({
                name: item.name,
                range: item.range,
                parent: item.parent,
                reason: error.message
              });
            }
          })
          .finally(() => {
            active--;
            if (fatalError) {
              reject(fatalError);
            } else if (active === 0 && cursor >= queue.length) {
              resolve();
            } else {
              pump();
            }
          });
      }

      if (active === 0 && cursor >= queue.length) resolve();
    };

    const processItem = async (item) => {
      const resolved = await client.resolve(item.name, item.range);
      const key = `${resolved.name}@${resolved.version}`;

      if (nodes.has(key)) return [];
      if (nodes.size >= maxPackages) {
        throw new Error(`Dependency graph exceeded the ${maxPackages} package safety limit.`);
      }

      const metadata = resolved.metadata ?? {};
      const dependencies = {
        ...(metadata.dependencies ?? {}),
        ...(metadata.optionalDependencies ?? {})
      };

      const node = {
        key,
        name: resolved.name,
        version: resolved.version,
        requestedRange: item.range,
        depth: item.depth,
        parent: item.parent,
        unpackedSize: numberOrZero(metadata.dist?.unpackedSize),
        fileCount: numberOrZero(metadata.dist?.fileCount),
        hasInstallScript: metadata.hasInstallScript === true,
        deprecated: Boolean(metadata.deprecated),
        modified: resolved.modified,
        dependencyCount: Object.keys(dependencies).length,
        peerDependencyCount: Object.keys(metadata.peerDependencies ?? {}).length
      };

      nodes.set(key, node);
      onProgress(nodes.size);

      const children = [];
      for (const [dependencyName, dependencyRange] of Object.entries(dependencies)) {
        const normalized = normalizeDependency(dependencyName, dependencyRange);
        if (!normalized) {
          unsupported.push({
            name: dependencyName,
            range: dependencyRange,
            parent: key
          });
          continue;
        }

        children.push({
          name: normalized.name,
          range: normalized.range,
          depth: item.depth + 1,
          parent: key
        });
      }

      return children;
    };

    pump();
  });

  const allNodes = [...nodes.values()];
  const root = allNodes.find((node) => node.depth === 0);
  if (!root) throw new Error('Could not resolve the requested package.');

  const staleThreshold = Date.now() - staleDays * 24 * 60 * 60 * 1000;
  const inactive = allNodes.filter((node) => {
    if (!node.modified) return false;
    const timestamp = Date.parse(node.modified);
    return Number.isFinite(timestamp) && timestamp < staleThreshold;
  });

  return {
    requested: `${rootSpec.name}@${rootSpec.range}`,
    resolved: root.key,
    root,
    totals: {
      packages: allNodes.length,
      transitivePackages: Math.max(0, allNodes.length - 1),
      unpackedSize: sum(allNodes, 'unpackedSize'),
      files: sum(allNodes, 'fileCount'),
      installScripts: allNodes.filter((node) => node.hasInstallScript).length,
      deprecated: allNodes.filter((node) => node.deprecated).length,
      inactive: inactive.length,
      maxDepth: allNodes.reduce((max, node) => Math.max(max, node.depth), 0),
      unsupportedSpecs: unsupported.length,
      unresolved: unresolved.length
    },
    staleDays,
    nodes: allNodes,
    unsupported,
    unresolved
  };
}

function sum(items, key) {
  return items.reduce((total, item) => total + numberOrZero(item[key]), 0);
}

function numberOrZero(value) {
  return Number.isFinite(value) ? value : 0;
}
