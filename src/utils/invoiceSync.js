import { supabase } from './supabase';

// Upserts invoice rows to the 'fisheye_invoices' table in chunks.
//
// Why this exists: if a row contains a field that doesn't exist yet as a column
// in Supabase (e.g. a new field added in code before the DB was migrated),
// PostgREST rejects the WHOLE batch with a "Could not find the '<field>' column"
// error (PGRST204) — and since upserts run as sequential chunks, that one bad
// field silently blocks every invoice in that chunk (and stops the rest of the
// sync loop) from ever reaching the cloud. From the user's point of view, saves
// just stop persisting — nothing shows an error, but a refresh loses the work.
//
// This helper detects that specific failure, strips the offending field from
// the batch, and retries — so app saves degrade gracefully (keep working,
// minus that one field) instead of failing outright whenever the code and the
// DB schema drift apart.
export async function upsertInvoices(rows, chunkSize = 50) {
  if (!rows || rows.length === 0) return { ok: true };
  for (let i = 0; i < rows.length; i += chunkSize) {
    let chunk = rows.slice(i, i + chunkSize);
    let attempts = 0;
    // Up to 5 retries: enough to strip a handful of unknown fields in one go
    // without looping forever on an unrelated error.
    while (attempts < 5) {
      const { error } = await supabase.from('fisheye_invoices').upsert(chunk, { onConflict: 'id' });
      if (!error) break;
      const missingCol = /Could not find the '([^']+)' column/.exec(error.message || '');
      if (missingCol) {
        const badField = missingCol[1];
        console.warn(`fisheye_invoices sync: column "${badField}" doesn't exist in Supabase yet — saving without it and retrying. Add the column to stop seeing this.`);
        chunk = chunk.map(row => {
          const { [badField]: _drop, ...rest } = row;
          return rest;
        });
        attempts++;
        continue;
      }
      console.warn('fisheye_invoices sync error:', error.message);
      return { ok: false, error };
    }
  }
  return { ok: true };
}
