// Static-site Supabase client. This file intentionally contains no secret.
const SUPABASE_CONFIG = window.SUPABASE_CONFIG || {};
const SUPABASE_READY = Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.publishableKey && !SUPABASE_CONFIG.publishableKey.includes('REPLACE_ME'));
const supabaseClient = SUPABASE_READY ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey) : null;
function requireSupabase() { if (!supabaseClient) throw new Error('ยังไม่ได้ตั้งค่า Supabase publishable key ใน supabase-config.js'); return supabaseClient; }
function supabaseError(error) { console.error('[Supabase]', error); return error?.message || 'เชื่อมต่อ Supabase ไม่สำเร็จ'; }
