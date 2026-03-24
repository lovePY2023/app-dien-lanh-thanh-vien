import { db } from './supabase.js';
import { initPOS } from './pos.js'; // Gọi khởi tạo POS

// --- CHUYỂN TAB ---
window.switchTab = (tabName) => {
    const tabs = document.querySelectorAll('.tab-content');
    const navBtns = document.querySelectorAll('nav button');
    tabs.forEach(t => t.classList.add('hidden'));
    navBtns.forEach(b => { b.classList.remove('text-blue-600'); b.classList.add('text-slate-400'); });

    if (tabName === 'schedule') {
        document.getElementById('tab-schedule').classList.remove('hidden');
        document.getElementById('btn-nav-schedule').classList.replace('text-slate-400', 'text-blue-600');
        window.loadData();
    } else {
        document.getElementById('tab-pos').classList.remove('hidden');
        document.getElementById('btn-nav-pos').classList.replace('text-slate-400', 'text-blue-600');
        initPOS(); // Khởi tạo POS khi bấm sang tab bán hàng
    }
};

// ... Giữ lại các hàm loadData(), renderTaskCard() và btnSave.onclick như bản trước ...
// Đảm bảo cuối file có:
window.loadData();
