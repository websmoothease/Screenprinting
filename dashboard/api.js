const STORAGE_KEY = 'naughty-dashboard-leads-v2';

const KINK_OPTIONS = ['feet', 'scented', 'roleplay', 'tease', 'custom'];

export function normalizeLead(input) {
  return {
    id: input.id,
    username: String(input.username || '').trim(),
    platform: input.platform,
    kink: KINK_OPTIONS.includes(input.kink) ? input.kink : 'custom',
    status: input.status || 'PREDICTIVE_SOON',
    lastTouch: input.lastTouch || 'just now',
    nextAction: input.nextAction || 'Pending schedule',
    predictedValue7d: Number(input.predictedValue7d ?? 40),
    confidence: Number(input.confidence ?? 0.5)
  };
}

function readAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeLead);
}

function writeAll(leads) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function ensureUniqueUsernamePlatform(leads, candidate, excludingId = null) {
  const duplicate = leads.find(
    (lead) =>
      lead.id !== excludingId &&
      lead.username.toLowerCase() === candidate.username.toLowerCase() &&
      lead.platform === candidate.platform
  );

  if (duplicate) {
    throw new Error('A lead with this username already exists for that platform.');
  }
}

export const leadsApi = {
  list() {
    return readAll();
  },

  seedIfEmpty(seedLeads) {
    const existing = readAll();
    if (existing.length) return existing;
    const normalized = seedLeads.map(normalizeLead);
    writeAll(normalized);
    return normalized;
  },

  create(input) {
    const leads = readAll();
    const candidate = normalizeLead({ ...input, id: String(Date.now() + Math.floor(Math.random() * 1000)) });
    if (!candidate.username) throw new Error('Username is required.');
    ensureUniqueUsernamePlatform(leads, candidate);
    const next = [candidate, ...leads];
    writeAll(next);
    return candidate;
  },

  update(id, patch) {
    const leads = readAll();
    const index = leads.findIndex((lead) => lead.id === id);
    if (index < 0) throw new Error('Lead not found.');

    const updated = normalizeLead({ ...leads[index], ...patch, id });
    if (!updated.username) throw new Error('Username is required.');
    ensureUniqueUsernamePlatform(leads, updated, id);

    leads[index] = updated;
    writeAll(leads);
    return updated;
  },

  remove(id) {
    const leads = readAll();
    const next = leads.filter((lead) => lead.id !== id);
    writeAll(next);
  }
};

export { KINK_OPTIONS };
