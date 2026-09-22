import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDependency, parsePackageSpec } from '../src/spec.js';

 test('parses unscoped package specs', () => {
  assert.deepEqual(parsePackageSpec('express'), { name: 'express', range: 'latest' });
  assert.deepEqual(parsePackageSpec('express@5'), { name: 'express', range: '5' });
});

test('parses scoped package specs', () => {
  assert.deepEqual(parsePackageSpec('@types/node'), { name: '@types/node', range: 'latest' });
  assert.deepEqual(parsePackageSpec('@types/node@22'), { name: '@types/node', range: '22' });
});

test('normalizes npm aliases and rejects local specs', () => {
  assert.deepEqual(normalizeDependency('legacy-name', 'npm:modern-name@^2.0.0'), {
    name: 'modern-name',
    range: '^2.0.0',
    alias: 'legacy-name'
  });
  assert.equal(normalizeDependency('local-package', 'file:../local-package'), null);
});
