import { db } from './supabase.js';

// --- LOGIC LỊCH LÀM VIỆC ---
window.loadData = async () => {
    const container = document.getElementById('main-grid-container');
    if(!container) return;

    // Hiệu ứng đang tải
    container.style.opacity = "0.5";
    
    const { data, error } = await db.fetchAll();
    if (error) { console.error(error); return; }

    const todayStr = new Date().toLocaleDateString('sv-SE');
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
            <div class="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[150px]">
                <div class="${isToday ? 'bg-blue-700' : 'bg-slate-600'} p-2 text-white text-[10px] font-bold uppercase flex justify-between items-center">
                    <span>${isToday ? 'HÔM NAY' : date.split('-').reverse().slice(0,2).join('/')}</span>
                    <span class="bg-white/20 px-1.5 py-0.5 rounded">${tasks.length}</span>
                </div>
                <div class="p-2 space-y-2">
                    ${tasks.map(i => renderTaskCard(i)).join('') || '<p class="text-[9px] text-slate-300 text-center py-10 italic tracking-tighter">Trống lịch</p>'}
                </div>
            </div>
        `;
    }).join('');
    
    container.style.opacity = "1";
};

function renderTaskCard(i) {
    const isDone = i.trang_thai === 'XONG';
    return `
        <div class="${isDone ? 'task-done' : 'bg-slate-50'} p-2.5 rounded-lg border border-slate-100 transition-all">
            <div class="flex justify-between items-start gap-1">
                <h4 class="font-bold text-[11px] text-slate-800 leading-none">${i.ten_khach}</h4>
                <span class="text-[7px] font-bold text-blue-600 bg-blue-50 px-1 rounded uppercase shrink-0">${i.loai_dich_vu}</span>
            </div>
            <p class="text-[9px] text-slate-500 mt-1 truncate">${i.dia_chi}</p>
            <div class="flex justify-between items-center mt-2 pt-2 border-t border-white">
                <span class="text-[8px] font-bold text-orange-600">Thợ: ${i.nguoi_phu_trach}</span>
                ${!isDone ? `<button onclick="window.finishJob('${i.id}')" class="text-[8px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold shadow-sm">XONG</button>` : '<i class="fas fa-check-circle text-emerald-500 text-xs"></i>'}
            </div>
        </div>
    `;
}

// --- SỬA LỖI NÚT LƯU ---
const btnSave = document.getElementById('btnSave');
if(btnSave) {
    btnSave.onclick = async () => {
        const newData = {
            ten_khach: document.getElementById('inpTen').value.trim(),
            so_dien_thoai: document.getElementById('inpSdt').value.trim(),
            dia_chi: document.getElementById('inpDiaChi').value.trim(),
            khu_vuc: document.getElementById('inpKhuVuc').value,
            loai_dich_vu: document.getElementById('inpDichVu').value,
            nguoi_phu_trach: document.getElementById('inpTho').value,
            ngay_thuc_hien: document.getElementById('inpNgay').value,
            trang_thai: 'CTY'
        };

        if(!newData.ten_khach) return alert("Vui lòng nhập tên khách!");

        btnSave.disabled = true;
        btnSave.innerText = "ĐANG LƯU...";

        const { error } = await db.insert(newData);
        if (!error) {
            // QUAN TRỌNG: Phải dùng await để đợi data tải xong mới báo thành công
            await window.loadData(); 
            ["inpTen", "inpSdt", "inpDiaChi"].forEach(id => document.getElementById(id).value = '');
            console.log("Đã cập nhật Grid");
        } else {
            alert("Lỗi: " + error.message);
        }
        btnSave.disabled = false;
        btnSave.innerText = "LƯU LỊCH LÀM VIỆC";
    };
}

// --- BAN HANG (POS) ---
window.addToCart = (sku, price) => {
    const customer = document.getElementById('posTen').value;
    if(!customer) return alert("Phải nhập tên khách hàng trước!");
    
    // Tạm thời log ra, sau này bạn tạo bảng 'DATA-HANG-HOA' mình sẽ insert vào đó
    console.log(`Bán ${sku} cho ${customer} giá ${price}`);
    alert(`Đã chọn: ${sku}\nKhách: ${customer}`);
};

// Khởi tạo lần đầu
window.loadData();
