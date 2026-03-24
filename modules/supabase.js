import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://vkduoktamuqtevplkrax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHVva3RhbXVxdGV2cGxrcmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNDk5NzIsImV4cCI6MjA4OTgyNTk3Mn0.r5e_qDlc8lwimEyqHL-8lBGjuYVMcaNZTxGU0IwfIVs';
const _supabase = createClient(supabaseUrl, supabaseKey);

export const db = {
    async fetchAll() {
        return await _supabase.from('DATA-KHACH-HANG').select('*').order('ngay_thuc_hien', { ascending: true });
    },
    async insert(obj) {
        return await _supabase.from('DATA-KHACH-HANG').insert([obj]);
    },
    from(table) { return _supabase.from(table); }
};
