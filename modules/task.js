import { db } from './supabase.js';

// --- ĐỒNG HỒ ---
setInterval(() => { 
    const clock = document.getElementById('clock');
    if(clock) clock.innerText = new Date().toLocaleString('vi-VN'); 
}, 1000);

// --- NGÀY THÁNG ---
const getTodayStr = () => new Date().toLocaleDateString('sv-SE');
const inpNgay = document.getElementById('inpNgay');
if(inpNgay) inpNgay.value = getTodayStr();

function formatVN(dateStr) {
    const d = new Date(dateStr);
    const days = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return `${days[d.getDay()]} - ${d.getDate()}/${d.getMonth()+1}`;
}

// --- CHUYỂN TAB ---
window.switchTab = (tabName) => {
    const tabs = document.querySelectorAll('.tab-content');
    const navBtns = document.querySelectorAll('nav button');
    tabs.forEach(t => t.classList.add('hidden'));
    navBtns.forEach(b => { b.classList.remove('text-blue-600'); b.classList.add('text-slate-400'); });

    if (tabName === 'pos') {
        document.getElementById('tab-pos').classList.remove('hidden');
        document.getElementById('btn-nav-pos').classList.replace('text-slate-400', 'text-blue-600');
    } else {
        document.getElementById('tab-schedule').classList.remove('hidden');
        document.getElementById('btn-nav-schedule').classList.replace('text-slate-400', 'text-blue-600');
        window.loadData();
    }
};

// --- HIỂN THỊ DỮ LIỆU ---
window.loadData = async () => {
    const container = document.getElementById('main-grid-container');
    if(!container) return;

    const { data, error } = await db.fetchAll();
    if (error) return;

    const todayStr = getTodayStr();
    
    // Nhóm task theo ngày
    const grouped = data.reduce((acc, item) => {
        const d = item.ngay_thuc_hien;
        if (!acc[d]) acc[d] = [];
        acc[d].push(item);
        return acc;
    }, {});

    // Tạo danh sách 4 ngày liên tiếp từ Hôm nay
    let displayDates = [];
    for(let i = 0; i < 4; i++) {
        let d = new Date();
        d.setDate(d.getDate() + i);
        displayDates.push(d.toLocaleDateString('sv-SE'));
    }

    let finalHtml = '';
    displayDates.forEach(date => {
        const tasks = grouped[date] || [];
        let titleLabel = formatVN(date);
        let colorClass = "bg-slate-500";
        
        if (date === todayStr) { titleLabel = "HÔM NAY"; colorClass = "bg-blue-700"; }
        else if (date === displayDates[1]) { titleLabel = "NGÀY MAI"; colorClass = "bg-slate-700"; }

        finalHtml += `
            <div class="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="${colorClass} p-2.5 text-white text-[10px] font-bold uppercase flex justify-between items-center">
                    <span>${titleLabel} (${date.split('-').slice(1).reverse().join('/')})</span>
                    <span class="bg-black/20 px-1.5 py-0.5 rounded text-[9px]">${tasks.length} Việc</span>
                </div>
                <div class="p-2 space-y-2 min-h-[100px]">
                    ${tasks.map(i => renderCard(i)).join('') || '<p class="text-[9px] text-slate-300 text-center py-10 italic">Trống lịch</p>'}
                </div>
            </div>
        `;
    });
    container.innerHTML = finalHtml;
};

function renderCard(item) {
    const isDone = item.trang_thai === 'XONG';
    return `
    <div class="${isDone ? 'task-done' : 'bg-white'} p-2.5 rounded-lg border border-slate-100 shadow-sm transition-all">
        <div class="flex justify-between items-start">
            <h4 class="font-bold text-[12px] text-slate-800 leading-tight">${item.ten_khach}</h4>
            <span class="text-[8px] font-bold text-blue-600 bg-blue-50 px-1 rounded uppercase shrink-0">${item.loai_dich_vu}</span>
        </div>
        <p class="text-[10px] text-slate-500 mt-1 truncate">${item.dia_chi}</p>
        <div class="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
            <span class="text-[9px] font-bold text-orange-600">Thợ: ${item.nguoi_phu_trach}</span>
            ${isDone ? '<span class="text-[9px] text-emerald-600 font-bold">✓ XONG</span>' : 
            `<button onclick="window.finishJob('${item.id}')" class="text-[9px] bg-emerald-600 text-white px-2 py-1 rounded font-bold">XONG</button>`}
        </div>
    </div>`;
}

// --- LƯU ĐƠN ---
document.getElementById('btnSave').onclick = async () => {
    const btn = document.getElementById('btnSave');
    const newData = {
        ten_khach: document.getElementById('inpTen').value.trim(),
        so_dien_thoai: document.getElementById('inpSdt').value.trim(),
        dia_chi: document.getElementById('inpDiaChi').value.trim(),
        khu_vuc: document.getElementById('inpKhuVuc').value,
        loai_dich_vu: document.getElementById('inpDichVu').value,
        nguoi_phu_trach: document.getElementById('inpTho').value,
        ngay_thuc_hien: document.getElementById('inpNgay').value,
        ghi_chu_cong_viec: document.getElementById('inpGhiChu').value.trim(),
        trang_thai: 'CTY'
    };

    if(!newData.ten_khach) return alert("Vui lòng nhập tên khách!");
    
    btn.disabled = true;
    btn.innerText = "ĐANG LƯU...";
    
    const { error } = await db.insert(newData);
    if (!error) {
        alert("Đã thêm đơn hàng!");
        ["inpTen", "inpSdt", "inpDiaChi", "inpGhiChu"].forEach(id => document.getElementById(id).value = '');
        window.switchTab('schedule');
    }
    btn.disabled = false;
    btn.innerText = "XÁC NHẬN TẠO ĐƠN";
};

window.finishJob = async (id) => {
    if(!confirm("Xác nhận hoàn thành việc này?")) return;
    const { error } = await db.from('DATA-KHACH-HANG').update({ trang_thai: 'XONG' }).eq('id', id);
    if(!error) window.loadData();
};

window.loadData();
