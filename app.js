import { db } from './supabase.js';

// Cài ngày mặc định là hôm nay
document.getElementById('inpNgay').valueAsDate = new Date();

window.toggleGroup = (id) => {
    const el = document.getElementById(id);
    el.classList.toggle('hidden');
};

async function loadData() {
    const { data, error } = await db.fetchAll();
    if (error) return;

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
            htmlToday += card; cToday++;
        } else if (itemDate.getTime() === tomorrow.getTime()) {
            htmlTomorrow += card; cTomorrow++;
        } else if (itemDate.getTime() > tomorrow.getTime()) {
            htmlFuture += card; cFuture++;
        }
    });

    document.getElementById('group-today').innerHTML = htmlToday || '<p class="text-center text-slate-400 py-3 text-xs italic">Trống</p>';
    document.getElementById('group-tomorrow').innerHTML = htmlTomorrow || '<p class="text-center text-slate-400 py-3 text-xs italic">Trống</p>';
    document.getElementById('group-future').innerHTML = htmlFuture || '<p class="text-center text-slate-400 py-3 text-xs italic">Trống</p>';

    document.getElementById('count-today').innerText = cToday;
    document.getElementById('count-tomorrow').innerText = cTomorrow;
    document.getElementById('count-future').innerText = cFuture;
}

function renderCard(item) {
    const d = new Date(item.ngay_thuc_hien);
    const dateShow = `${d.getDate()}/${d.getMonth() + 1}`;

    return `
    <div class="bg-slate-50 p-2 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-full">
        <div class="mb-2">
            <div class="flex justify-between items-start gap-1">
                <h4 class="font-bold text-slate-800 text-[13px] leading-tight truncate">${item.ten_khach}</h4>
                <span class="text-[8px] font-bold text-blue-500 bg-white px-1 border border-blue-100 rounded uppercase whitespace-nowrap">${item.loai_dich_vu.split(' ')[0]}</span>
            </div>
            <p class="text-[10px] text-slate-500 truncate mt-1">${item.dia_chi || '...'}</p>
            <p class="text-[9px] text-slate-400 italic">${dateShow}</p>
        </div>
        
        <div class="flex gap-1 border-t pt-2">
            <a href="tel:${item.so_dien_thoai}" class="flex-1 bg-emerald-500 text-white py-2 rounded-md flex items-center justify-center text-[10px]">
                <i class="fas fa-phone"></i>
            </a>
            <button onclick="window.finishJob('${item.id}')" class="flex-1 bg-slate-200 text-slate-600 py-2 rounded-md flex items-center justify-center text-[10px]">
                <i class="fas fa-check"></i>
            </button>
        </div>
    </div>`;
}

document.getElementById('btnSave').onclick = async () => {
    const btn = document.getElementById('btnSave');
    const newData = {
        ten_khach: document.getElementById('inpTen').value.trim(),
        so_dien_thoai: document.getElementById('inpSdt').value.trim(),
        ngay_thuc_hien: document.getElementById('inpNgay').value,
        loai_dich_vu: document.getElementById('inpDichVu').value,
        dia_chi: document.getElementById('inpDiaChi').value.trim(),
        ghi_chu: document.getElementById('inpGhiChu').value.trim(),
        trang_thai: 'CTY'
    };

    if (!newData.ten_khach) return alert("Nhập tên khách!");

    btn.disabled = true;
    btn.innerText = "ĐANG LƯU...";

    const { error } = await db.insert(newData);
    if (!error) {
        // Reset form nhanh
        document.getElementById('inpTen').value = '';
        document.getElementById('inpSdt').value = '';
        document.getElementById('inpDiaChi').value = '';
        document.getElementById('inpGhiChu').value = '';
        loadData();
    }
    btn.disabled = false;
    btn.innerText = "LƯU VÀO LỊCH";
};

window.finishJob = async (id) => {
    if(confirm("Xác nhận xong việc?")) {
        await db.updateStatus(id, 'XONG');
        loadData();
    }
};

loadData();
