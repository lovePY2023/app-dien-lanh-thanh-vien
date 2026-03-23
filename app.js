import { db } from './supabase.js';

// Cài đặt ngày mặc định là hôm nay trong form
document.getElementById('inpNgay').valueAsDate = new Date();

window.toggleGroup = (id) => {
    document.getElementById(id).classList.toggle('hidden');
};

async function loadData() {
    const { data, error } = await db.fetchAll();
    if (error) return;

    // Lấy mốc thời gian chuẩn
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let htmlToday = '', htmlTomorrow = '', htmlFuture = '';
    let cToday = 0, cTomorrow = 0, cFuture = 0;

    data.forEach(item => {
        const itemDate = new Date(item.ngay_thuc_hien);
        itemDate.setHours(0,0,0,0);

        const card = renderCard(item);

        if (itemDate.getTime() === today.getTime()) {
            htmlToday += card;
            cToday++;
        } else if (itemDate.getTime() === tomorrow.getTime()) {
            htmlTomorrow += card;
            cTomorrow++;
        } else if (itemDate.getTime() > tomorrow.getTime()) {
            htmlFuture += card;
            cFuture++;
        }
    });

    document.getElementById('group-today').innerHTML = htmlToday || '<p class="text-center text-slate-400 py-4 text-xs italic">Không có lịch hôm nay</p>';
    document.getElementById('group-tomorrow').innerHTML = htmlTomorrow || '<p class="text-center text-slate-400 py-4 text-xs italic">Không có lịch ngày mai</p>';
    document.getElementById('group-future').innerHTML = htmlFuture || '<p class="text-center text-slate-400 py-4 text-xs italic">Không có lịch sắp tới</p>';

    document.getElementById('count-today').innerText = cToday;
    document.getElementById('count-tomorrow').innerText = cTomorrow;
    document.getElementById('count-future').innerText = cFuture;
}

function renderCard(item) {
    return `
    <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-2 relative">
        <div class="flex justify-between items-start">
            <div>
                <h4 class="font-bold text-slate-800 text-base">${item.ten_khach}</h4>
                <p class="text-xs text-slate-500 mb-1 italic">${item.dia_chi || 'Không có địa chỉ'}</p>
                <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">${item.loai_dich_vu}</span>
            </div>
            <a href="tel:${item.so_dien_thoai}" class="bg-emerald-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">
                <i class="fas fa-phone"></i>
            </a>
        </div>
        <div class="mt-3 flex gap-2">
            <button onclick="window.updateStatus('${item.id}', 'HOÀN TẤT')" class="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-xs font-bold uppercase tracking-wider">Xong việc</button>
        </div>
    </div>`;
}

// Xử lý Lưu dữ liệu
document.getElementById('btnSave').onclick = async () => {
    const btnSave = document.getElementById('btnSave');
    const newData = {
        ten_khach: document.getElementById('inpTen').value,
        so_dien_thoai: document.getElementById('inpSdt').value,
        ngay_thuc_hien: document.getElementById('inpNgay').value,
        loai_dich_vu: document.getElementById('inpDichVu').value,
        dia_chi: document.getElementById('inpDiaChi').value,
        ghi_chu: document.getElementById('inpGhiChu').value,
        trang_thai: 'CTY'
    };

    if (!newData.ten_khach || !newData.ngay_thuc_hien) {
        alert("Vui lòng nhập Tên và Ngày hẹn!");
        return;
    }

    btnSave.disabled = true;
    const { error } = await db.insert(newData);

    if (!error) {
        document.getElementById('form-container').classList.add('hidden');
        loadData();
    }
    btnSave.disabled = false;
};

// Đóng mở form
document.getElementById('btnOpenForm').onclick = () => document.getElementById('form-container').classList.remove('hidden');
document.getElementById('btnClose').onclick = () => document.getElementById('form-container').classList.add('hidden');

loadData();

window.updateStatus = async (id, status) => {
    await db.updateStatus(id, status);
    loadData();
};
