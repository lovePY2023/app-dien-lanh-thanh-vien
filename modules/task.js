import { db } from './supabase.js';

// --- ĐỒNG HỒ ---
setInterval(() => { 
    const clock = document.getElementById('clock');
    if(clock) clock.innerText = new Date().toLocaleTimeString('vi-VN'); 
}, 1000);

const getTodayStr = () => new Date().toLocaleDateString('sv-SE');
if(document.getElementById('inpNgay')) document.getElementById('inpNgay').value = getTodayStr();

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
    }
};

// --- QUẢN LÝ LỊCH (4 CỘT) ---
window.loadData = async () => {
    const container = document.getElementById('main-grid-container');
    if(!container) return;
    const { data, error } = await db.fetchAll();
    if (error) return;

    const todayStr = getTodayStr();
    const grouped = data.reduce((acc, item) => {
        const d = item.ngay_thuc_hien;
        if (!acc[d]) acc[d] = [];
        acc[d].push(item);
        return acc;
    }, {});

    let displayDates = [];
    for(let i = 0; i < 4; i++) {
        let d = new Date();
        d.setDate(d.getDate() + i);
        displayDates.push(d.toLocaleDateString('sv-SE'));
    }

    container.innerHTML = displayDates.map(date => {
        const tasks = grouped[date] || [];
        const isToday = date === todayStr;
        return `
            <div class="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="${isToday ? 'bg-blue-700' : 'bg-slate-600'} p-2 text-white text-[10px] font-bold uppercase flex justify-between">
                    <span>${isToday ? 'Hôm nay' : date.split('-').reverse().slice(0,2).join('/')}</span>
                    <span>${tasks.length} VIỆC</span>
                </div>
                <div class="p-2 space-y-2">
                    ${tasks.map(i => `
                        <div class="${i.trang_thai === 'XONG' ? 'task-done' : 'bg-white'} p-2 rounded border border-slate-100 shadow-sm">
                            <h4 class="font-bold text-[11px]">${i.ten_khach}</h4>
                            <p class="text-[9px] text-slate-500 truncate">${i.dia_chi}</p>
                            <div class="flex justify-between mt-2">
                                <span class="text-[8px] font-bold text-orange-600">${i.nguoi_phu_trach}</span>
                                ${i.trang_thai !== 'XONG' ? `<button onclick="window.finishJob('${i.id}')" class="text-[8px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">XONG</button>` : '<span class="text-[8px] text-emerald-600 font-bold">✓</span>'}
                            </div>
                        </div>
                    `).join('') || '<p class="text-[9px] text-slate-300 text-center py-4 italic">Trống</p>'}
                </div>
            </div>
        `;
    }).join('');
};

// --- LƯU LỊCH ---
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
    if(!newData.ten_khach) return alert("Nhập tên!");
    btn.disabled = true;
    const { error } = await db.insert(newData);
    if(!error) { 
        window.loadData(); 
        ["inpTen", "inpSdt", "inpDiaChi"].forEach(id => document.getElementById(id).value = '');
    }
    btn.disabled = false;
};

// --- BÁN HÀNG (POS) ---
window.addToCart = (name, price) => {
    const ten = document.getElementById('posTen').value;
    if(!ten) return alert("Nhập tên khách trước khi chọn hàng!");
    if(confirm(`Bán [${name}] - ${price.toLocaleString()}đ cho khách ${ten}?`)) {
        console.log("Đã tạo đơn hàng:", { name, price, customer: ten });
        alert(`Đã lên đơn: ${name}`);
    }
};

window.finishJob = async (id) => {
    await db.from('DATA-KHACH-HANG').update({ trang_thai: 'XONG' }).eq('id', id);
    window.loadData();
};

window.loadData();
