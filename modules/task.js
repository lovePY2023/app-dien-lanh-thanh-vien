import { db } from './supabase.js';
import { initPOS } from './pos.js'; // <--- Bắc cầu sang POS

// --- QUẢN LÝ CHUYỂN TAB (HÀM QUAN TRỌNG NHẤT) ---
window.switchTab = (tabName) => {
    // 1. Ẩn hiện nội dung
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    const target = document.getElementById(`tab-${tabName}`);
    if (target) target.classList.remove('hidden');

    // 2. Cập nhật màu sắc Menu Bottom
    const btnPos = document.getElementById('btn-nav-pos');
    const btnSchedule = document.getElementById('btn-nav-schedule');
    
    if (tabName === 'pos') {
        btnPos.classList.replace('text-slate-400', 'text-blue-600');
        btnSchedule.classList.replace('text-blue-600', 'text-slate-400');
        initPOS(); // Gọi thợ xây POS làm việc
    } else {
        btnSchedule.classList.replace('text-slate-400', 'text-blue-600');
        btnPos.classList.replace('text-blue-600', 'text-slate-400');
        window.loadData(); // Gọi thợ xây Lịch làm việc
    }
};

// --- QUẢN LÝ LỊCH LÀM VIỆC (GRID 4 CỘT) ---
window.loadData = async () => {
    const container = document.getElementById('main-grid-container');
    if (!container) return;

    const { data, error } = await db.fetchAll();
    if (error) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const grouped = (data || []).reduce((acc, item) => {
        const d = item.ngay_thuc_hien;
        if (!acc[d]) acc[d] = [];
        acc[d].push(item);
        return acc;
    }, {});

    let html = '';
    for (let i = 0; i < 4; i++) {
        let d = new Date();
        d.setDate(d.getDate() + i);
        const dStr = d.toISOString().split('T')[0];
        const tasks = grouped[dStr] || [];
        
        let label = dStr.split('-').reverse().slice(0,2).join('/');
        let color = i === 0 ? "bg-blue-700" : "bg-slate-600";
        if (i === 0) label = "HÔM NAY";

        html += `
            <div class="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[200px]">
                <div class="${color} p-2 text-white text-[10px] font-bold uppercase flex justify-between">
                    <span>${label}</span>
                    <span class="bg-white/20 px-1.5 rounded">${tasks.length}</span>
                </div>
                <div class="p-2 space-y-2">
                    ${tasks.map(t => `
                        <div class="${t.trang_thai === 'XONG' ? 'bg-emerald-50 opacity-60' : 'bg-slate-50'} p-2 rounded-lg border border-slate-100 shadow-sm">
                            <h4 class="font-bold text-[11px]">${t.ten_khach}</h4>
                            <p class="text-[9px] text-slate-500 truncate">${t.dia_chi}</p>
                            <div class="flex justify-between mt-2 pt-1 border-t border-white">
                                <span class="text-[8px] font-bold text-orange-600">${t.nguoi_phu_trach}</span>
                                ${t.trang_thai !== 'XONG' ? `<button onclick="window.finishJob('${t.id}')" class="text-[8px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">XONG</button>` : '✓'}
                            </div>
                        </div>
                    `).join('') || '<p class="text-[9px] text-slate-300 text-center py-10 italic">Trống</p>'}
                </div>
            </div>`;
    }
    container.innerHTML = html;
};

// --- XỬ LÝ LƯU ĐƠN ---
const btnSave = document.getElementById('btnSave');
if (btnSave) {
    btnSave.onclick = async () => {
        const newData = {
            ten_khach: document.getElementById('inpTen').value,
            so_dien_thoai: document.getElementById('inpSdt').value,
            dia_chi: document.getElementById('inpDiaChi').value,
            khu_vuc: document.getElementById('inpKhuVuc').value,
            loai_dich_vu: document.getElementById('inpDichVu').value,
            nguoi_phu_trach: document.getElementById('inpTho').value,
            ngay_thuc_hien: document.getElementById('inpNgay').value,
            trang_thai: 'CTY'
        };
        btnSave.disabled = true;
        const { error } = await db.insert(newData);
        if (!error) {
            await window.loadData();
            ["inpTen", "inpSdt", "inpDiaChi"].forEach(id => document.getElementById(id).value = '');
        }
        btnSave.disabled = false;
    };
}

window.finishJob = async (id) => {
    if(!confirm("Xác nhận xong?")) return;
    await db.from('DATA-KHACH-HANG').update({ trang_thai: 'XONG' }).eq('id', id);
    window.loadData();
};

// Khởi chạy khi vào trang
document.addEventListener('DOMContentLoaded', () => { window.loadData(); });
