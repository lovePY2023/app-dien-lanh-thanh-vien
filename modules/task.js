import { db } from './supabase.js';
import { initPOS } from './pos.js';

// --- TIỆN ÍCH NGÀY GIỜ VN ---
const getVNDate = (dateObj = new Date()) => {
    const d = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000)); // Cộng 7 tiếng
    return d.toISOString().split('T')[0];
};

// Đăng ký chuyển Tab
window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    const target = document.getElementById(`tab-${tabName}`);
    if (target) target.classList.remove('hidden');

    const btnPos = document.getElementById('btn-nav-pos');
    const btnSchedule = document.getElementById('btn-nav-schedule');
    
    if (tabName === 'pos') {
        btnPos.classList.replace('text-slate-400', 'text-blue-600');
        btnSchedule.classList.replace('text-blue-600', 'text-slate-400');
        initPOS(); 
    } else {
        btnSchedule.classList.replace('text-slate-400', 'text-blue-600');
        btnPos.classList.replace('text-blue-600', 'text-slate-400');
        window.loadData(); 
    }
};

// --- HÀM TẢI DỮ LIỆU (FIX LỖI MẤT VIỆC) ---
window.loadData = async () => {
    const container = document.getElementById('main-grid-container');
    if (!container) return;

    const { data, error } = await db.fetchAll();
    if (error) {
        console.error("Lỗi Fetch:", error);
        return;
    }

    // Nhóm việc theo ngày (Chuẩn hóa format YYYY-MM-DD)
    const grouped = (data || []).reduce((acc, item) => {
        const d = item.ngay_thuc_hien ? item.ngay_thuc_hien.split('T')[0] : "";
        if (!acc[d]) acc[d] = [];
        acc[d].push(item);
        return acc;
    }, {});

    let html = '';
    const today = new Date();

    for (let i = 0; i < 4; i++) {
        const currentLoopDate = new Date(today);
        currentLoopDate.setDate(today.getDate() + i);
        const dStr = currentLoopDate.toISOString().split('T')[0];
        
        const tasks = grouped[dStr] || [];
        const isToday = i === 0;
        const label = isToday ? "HÔM NAY" : dStr.split('-').reverse().slice(0,2).join('/');

        html += `
            <div class="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[180px]">
                <div class="${isToday ? 'bg-blue-700' : 'bg-slate-600'} p-2.5 text-white text-[10px] font-bold uppercase flex justify-between">
                    <span>${label}</span>
                    <span class="bg-white/20 px-1.5 rounded text-[9px]">${tasks.length} Việc</span>
                </div>
                <div class="p-2 space-y-2">
                    ${tasks.map(t => `
                        <div class="${t.trang_thai === 'XONG' ? 'bg-emerald-50 opacity-60' : 'bg-white'} p-2 rounded-lg border border-slate-100 shadow-sm border-l-4 ${t.trang_thai === 'XONG' ? 'border-l-emerald-400' : 'border-l-blue-400'}">
                            <h4 class="font-bold text-[11px] text-slate-800">${t.ten_khach || 'Khách không tên'}</h4>
                            <p class="text-[9px] text-slate-500 truncate">${t.dia_chi || '...'}</p>
                            <div class="flex justify-between mt-2 items-center">
                                <span class="text-[8px] font-bold text-orange-600 uppercase">${t.nguoi_phu_trach}</span>
                                ${t.trang_thai !== 'XONG' ? `<button onclick="window.finishJob('${t.id}')" class="text-[8px] bg-emerald-600 text-white px-2 py-1 rounded font-bold">XONG</button>` : '<i class="fas fa-check-circle text-emerald-500"></i>'}
                            </div>
                        </div>
                    `).join('') || '<p class="text-[9px] text-slate-300 text-center py-10 italic">Trống lịch</p>'}
                </div>
            </div>`;
    }
    container.innerHTML = html;
};

// Gán hàm XONG cho window
window.finishJob = async (id) => {
    if(!confirm("Xác nhận hoàn thành?")) return;
    const { error } = await db.from('DATA-KHACH-HANG').update({ trang_thai: 'XONG' }).eq('id', id);
    if(!error) window.loadData();
};

// Nút lưu
document.getElementById('btnSave').onclick = async () => {
    const btn = document.getElementById('btnSave');
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
    btn.disabled = true;
    const { error } = await db.insert(newData);
    if (!error) {
        await window.loadData();
        ["inpTen", "inpSdt", "inpDiaChi"].forEach(id => document.getElementById(id).value = '');
    }
    btn.disabled = false;
};

document.addEventListener('DOMContentLoaded', window.loadData);
