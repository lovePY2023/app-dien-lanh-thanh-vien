import { db } from './supabase.js';

// Đồng hồ và ngày mặc định
setInterval(() => {
    document.getElementById('current-time').innerText = new Date().toLocaleString('vi-VN');
}, 1000);
document.getElementById('inpNgay').valueAsDate = new Date();

async function loadData() {
    const { data, error } = await db.fetchAll();
    if (error) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Reset nội dung
    let groups = { today: '', tomorrow: '', future: '' };
    let counts = { today: 0, tomorrow: 0, future: 0 };

    data.forEach(item => {
        const card = renderCard(item);
        // Kiểm tra ngày và cộng dồn vào chuỗi HTML tương ứng
        if (item.ngay_thuc_hien === todayStr) {
            groups.today += card; counts.today++;
        } else if (item.ngay_thuc_hien === tomorrowStr) {
            groups.tomorrow += card; counts.tomorrow++;
        } else if (item.ngay_thuc_hien > tomorrowStr) {
            groups.future += card; counts.future++;
        }
    });

    document.getElementById('group-today').innerHTML = groups.today || '<p class="col-span-2 text-center text-[10px] text-slate-300 py-4">Trống</p>';
    document.getElementById('group-tomorrow').innerHTML = groups.tomorrow || '<p class="col-span-2 text-center text-[10px] text-slate-300 py-4">Trống</p>';
    document.getElementById('group-future').innerHTML = groups.future || '<p class="col-span-2 text-center text-[10px] text-slate-300 py-4">Trống</p>';
    
    document.getElementById('count-today').innerText = counts.today;
    document.getElementById('count-tomorrow').innerText = counts.tomorrow;
    document.getElementById('count-future').innerText = counts.future;
}

function renderCard(item) {
    const isDone = item.trang_thai === 'XONG';
    const cardStyle = isDone ? 'task-done shadow-none' : 'bg-white shadow-sm border-slate-200';
    
    return `
    <div class="${cardStyle} p-3 rounded-lg border transition-all duration-300">
        <div class="flex justify-between items-start">
            <div class="flex-1 overflow-hidden">
                <h4 class="font-bold text-slate-800 text-[13px] truncate flex items-center gap-1">
                    ${item.ten_khach}
                    <a href="tel:${item.so_dien_thoai}" class="text-blue-500 p-1"><i class="fas fa-phone-alt text-[10px]"></i></a>
                </h4>
                <p class="text-[10px] text-slate-400 truncate">${item.dia_chi}</p>
            </div>
            <span class="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase shrink-0">${item.loai_dich_vu}</span>
        </div>
        
        <div class="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
            <span class="text-[9px] text-slate-500 font-semibold">Thợ: ${item.nguoi_phu_trach}</span>
            
            ${isDone ? 
                `<span class="text-[9px] text-emerald-600 font-bold flex items-center">
                    <i class="fas fa-check-circle mr-1"></i> Hoàn thành: ${item.ghi_chu_cong_viec}
                </span>` : 
                `<button onclick="window.finishJob('${item.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] px-3 py-1.5 rounded font-bold transition-all shadow-sm">
                    HOÀN THÀNH
                </button>`
            }
        </div>
    </div>`;
}

document.getElementById('btnSave').onclick = async () => {
    const btn = document.getElementById('btnSave');
    const newData = {
        ten_khach: document.getElementById('inpTen').value.trim(),
        so_dien_thoai: document.getElementById('inpSdt').value.trim(),
        dia_chi: document.getElementById('inpDiaChi').value.trim(),
        nguoi_phu_trach: document.getElementById('inpTho').value,
        loai_dich_vu: document.getElementById('inpDichVu').value,
        ngay_thuc_hien: document.getElementById('inpNgay').value,
        trang_thai: 'CTY'
    };

    if(!newData.ten_khach || !newData.so_dien_thoai) return alert("Nhập Tên và SĐT!");

    btn.disabled = true;
    const { error } = await db.insert(newData);
    if (!error) {
        alert("Đã lưu lịch!");
        ["inpTen", "inpSdt", "inpDiaChi"].forEach(id => document.getElementById(id).value = '');
        loadData();
    }
    btn.disabled = false;
};

window.finishJob = async (id) => {
    const n = new Date();
    const timeText = `${n.getHours()}:${n.getMinutes().toString().padStart(2,'0')} (${n.getDate()}/${n.getMonth()+1})`;
    
    if(confirm("Xác nhận hoàn thành việc này?")) {
        // Gọi trực tiếp Supabase để cập nhật trạng thái
        const { error } = await db.updateStatus(id, 'XONG');
        // Lưu ngày giờ vào cột ghi_chu_cong_viec
        await db.from('DATA-KHACH-HANG').update({ ghi_chu_cong_viec: timeText }).eq('id', id);
        
        loadData();
    }
};

loadData();
