import { describe, it, expect, beforeEach } from 'vitest';
import {
  classifyProject,
  classifyProjectStrict,
  sanitizeClientName,
  getEffectiveClientsList,
  getEffectiveClientMeta,
  getEffectiveMappingRules,
  clientRequiresPO,
  DEFAULT_MAPPING_RULES,
  DEFAULT_CLIENT_META,
  CONFIG_KEY,
} from '../../src/utils/appConfig.js';

beforeEach(() => {
  localStorage.clear();
});

describe('classifyProject / classifyProjectStrict', () => {
  it('matches an exact rule case-insensitively', () => {
    expect(classifyProjectStrict('alpha')).toBe('Alpha');
    expect(classifyProjectStrict('ALPHA')).toBe('Alpha');
  });

  it('matches a contains rule', () => {
    expect(classifyProjectStrict('ZATCA Batch 2')).toBe('ZATCA');
  });

  it('returns null (needs manual assignment) for an unrecognized project under the strict classifier', () => {
    expect(classifyProjectStrict('Some Totally New Project')).toBeNull();
  });

  it('classifyProject (non-strict) falls back to the default client instead of null', () => {
    // This is exactly the "silently defaults to Sela" behavior -- only
    // acceptable where a human has already been shown a chance to override
    // it (e.g. as a convenience pre-fill), never as a substitute for asking.
    expect(classifyProject('Some Totally New Project')).toBe('Sela');
  });

  it('empty/blank project returns null under the strict classifier', () => {
    expect(classifyProjectStrict('')).toBeNull();
    expect(classifyProjectStrict('   ')).toBeNull();
  });
});

describe('sanitizeClientName', () => {
  it('strips invisible Arabic combining marks that make a name silently stop matching', () => {
    // This is the exact real-world corruption found in the live saved
    // config: "Sela" with two invisible Arabic kasra marks baked in, which
    // looks identical on screen but fails every plain string comparison.
    const corrupted = 'SِِELA';
    expect(sanitizeClientName(corrupted)).toBe('SELA');
  });

  it('collapses internal whitespace and trims', () => {
    expect(sanitizeClientName('  Combuzz   HR  ')).toBe('Combuzz HR');
  });
});

describe('getEffectiveMappingRules — merge, not replace (regression test)', () => {
  it('falls back to DEFAULT_MAPPING_RULES when nothing is saved', () => {
    expect(getEffectiveMappingRules()).toEqual(DEFAULT_MAPPING_RULES);
  });

  it('REGRESSION: an old saved rule set (predating later-added clients) still picks up new default rules instead of masking them', () => {
    // This reproduces the exact bug that hid SPL/Pentagram/Finara/etc from
    // Reconcile: an account's saved config had only 9 old rules from before
    // those clients were registered in code. Merge must add every default
    // rule the saved set doesn't already cover, while still respecting the
    // saved rules that DO exist.
    const oldSavedRules = [
      { client: 'Riva Engineering', matchType: 'exact', value: 'CEO' },
      { client: 'Combuzz HR', matchType: 'contains', value: 'MAVERIC' },
      { client: 'Sela', matchType: 'default', value: '' },
    ];
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ mappingRules: oldSavedRules }));

    const merged = getEffectiveMappingRules();

    // Saved rules are preserved...
    expect(merged.find(r => r.value === 'CEO')).toBeTruthy();
    expect(merged.find(r => r.value === 'MAVERIC')).toBeTruthy();
    // ...and every default rule not already covered by a saved rule is
    // still present, so newer clients classify correctly even on an
    // account with an old saved config.
    expect(classifyProjectStrict('SPL', merged)).toBe('SPL');
    expect(classifyProjectStrict('Pentagram Batch 3', merged)).toBe('Pentagram');
    expect(classifyProjectStrict('Finara', merged)).toBe('Finara');
    // The trailing rule must still be the "default" fallback, and it must
    // be the SAVED one (the account's own choice), not silently swapped
    // for the coded default.
    expect(merged[merged.length - 1]).toEqual({ client: 'Sela', matchType: 'default', value: '' });
  });

  it('a saved rule for the same (matchType, value) pair overrides the coded default instead of duplicating it', () => {
    const savedRules = [
      { client: 'Some Other Client', matchType: 'exact', value: 'ALPHA' }, // overrides DEFAULT's "Alpha"
      { client: 'Sela', matchType: 'default', value: '' },
    ];
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ mappingRules: savedRules }));
    const merged = getEffectiveMappingRules();
    expect(classifyProjectStrict('ALPHA', merged)).toBe('Some Other Client');
    // Only one rule should exist for the exact:"ALPHA" key, not two.
    const alphaRules = merged.filter(r => r.matchType === 'exact' && r.value.toUpperCase() === 'ALPHA');
    expect(alphaRules.length).toBe(1);
  });
});

describe('getEffectiveClientMeta — merge, not replace', () => {
  it('a client added in code (DEFAULT_CLIENT_META) still appears even with an older saved config', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ clientMeta: { Sela: DEFAULT_CLIENT_META.Sela } }));
    const merged = getEffectiveClientMeta();
    expect(merged.Pentagram).toBeTruthy();
    expect(merged.ZATCA).toBeTruthy();
  });

  it('a saved customization (e.g. a recolored client) overrides the coded default', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      clientMeta: { Sela: { badge: '#000000', text: '#ffffff', dot: '#123456', phone: '0500000000' } },
    }));
    const merged = getEffectiveClientMeta();
    expect(merged.Sela.badge).toBe('#000000');
    expect(merged.Sela.phone).toBe('0500000000');
  });
});

describe('getEffectiveClientsList — merge, not replace', () => {
  it('surfaces both saved and coded-default client names, deduplicated', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ clientsList: ['Riva Engineering 3', 'Sela'] }));
    const merged = getEffectiveClientsList();
    expect(merged).toContain('Riva Engineering 3');
    expect(merged).toContain('Sela');
    expect(merged).toContain('Pentagram'); // from clientMeta keys, not clientsList/DEFAULT_CLIENTS_LIST
    expect(new Set(merged).size).toBe(merged.length); // no duplicates
  });
});

describe('removedClients — a deleted/renamed coded default must not resurrect itself (regression test)', () => {
  // Reproduces the real bug: "Riva Engineering 2" and "Pentagram" are coded
  // defaults (DEFAULT_CLIENTS_LIST / DEFAULT_CLIENT_META). Deleting or
  // renaming them from the Configuration page saved clientsList/clientMeta
  // correctly, but getEffectiveClientsList/getEffectiveClientMeta always
  // re-merged the coded defaults back in on the very next load -- a union
  // can only add keys, never remove one -- so the deletion silently
  // reverted after Save's auto-reload, no matter how many times it was
  // retried.
  it('a removed coded-default name is excluded from getEffectiveClientsList', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      clientsList: ['Sela'],
      removedClients: ['Riva Engineering 2', 'Pentagram'],
    }));
    const merged = getEffectiveClientsList();
    expect(merged).not.toContain('Riva Engineering 2');
    expect(merged).not.toContain('Pentagram');
    expect(merged).toContain('Sela');
  });

  it('a removed coded-default name is excluded from getEffectiveClientMeta', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      clientMeta: { Sela: DEFAULT_CLIENT_META.Sela },
      removedClients: ['Riva Engineering 2'],
    }));
    const merged = getEffectiveClientMeta();
    expect(merged['Riva Engineering 2']).toBeUndefined();
    expect(merged.Sela).toBeTruthy();
  });

  it('a removed coded-default client\'s classification rule is excluded from getEffectiveMappingRules', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      removedClients: ['Pentagram'],
    }));
    const merged = getEffectiveMappingRules();
    expect(merged.some(r => r.client === 'Pentagram')).toBe(false);
    expect(classifyProjectStrict('PENTAGRAM Batch 1', merged)).toBeNull();
  });

  it('a client name later reused by a real employee is not permanently blocked -- only Save re-derives removedClients', () => {
    // removedClients is recomputed fresh on every Configuration Save (see
    // doSave in App.jsx) from whichever coded defaults are absent from the
    // final saved list, so a name coming back via a normal saved clientsList
    // entry is unaffected by an older removedClients tombstone.
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      clientsList: ['Sela', 'Pentagram'],
      removedClients: ['Pentagram'],
    }));
    const merged = getEffectiveClientsList();
    expect(merged).toContain('Pentagram');
  });
});


describe('clientRequiresPO', () => {
  it('defaults to true for Sela with no saved config (coded default has requiresPO:true)', () => {
    expect(clientRequiresPO('Sela')).toBe(true);
  });

  it('defaults to false for any other known or unknown client with no saved config', () => {
    expect(clientRequiresPO('SPL')).toBe(false);
    expect(clientRequiresPO('Channel Play')).toBe(false);
    expect(clientRequiresPO('Some Brand New Client')).toBe(false);
  });

  it('respects an explicit saved requiresPO:true override on a client that defaults to false', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      clientMeta: { 'SPL': { requiresPO: true } },
    }));
    expect(clientRequiresPO('SPL')).toBe(true);
  });

  it('respects an explicit saved requiresPO:false override on Sela, overriding its coded default', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      clientMeta: { 'Sela': { requiresPO: false } },
    }));
    expect(clientRequiresPO('Sela')).toBe(false);
  });

  it('falls back to the name === "Sela" default when a saved meta record exists but requiresPO is not a boolean', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      clientMeta: { 'Sela': { phone: '0500000000' }, 'SPL': { phone: '0511111111' } },
    }));
    expect(clientRequiresPO('Sela')).toBe(true);
    expect(clientRequiresPO('SPL')).toBe(false);
  });
});
