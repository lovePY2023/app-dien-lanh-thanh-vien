import { db } from './supabase.js';

// Mặc định ngày hôm nay
document.getElementById('inpNgay').valueAsDate = new Date();

async function loadData() {
    const { data, error } = await db.fetchAll();
    if (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        return;
    }

    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    let htmlToday = '', htmlTomorrow = '', htmlFuture = '';
    let cToday = 0, cTomorrow = 0, cFuture = 0;

    // Chỉ hiện các việc có trạng thái 'CTY' (Chưa xong)
    const activeJobs = data.filter(item => item.trang_thai === 'CTY');

    activeJobs.forEach(item => {
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

    document.getElementById('group-today').innerHTML = htmlToday || '<p class="col-span-2 text-center py-4 text-[10px] text-slate-400">Trống</p>';
    document.getElementById('group-tomorrow').innerHTML = htmlTomorrow || '<p class="col-span-2 text-center py-4 text-[10px] text-slate-400">Trống</p>';
    document.getElementById('group-future').innerHTML = htmlFuture || '<p class="col-span-2 text-center py-4 text-[10px] text-slate-400">Trống</p>';

    document.getElementById('count-today').innerText = cToday;
    document.getElementById('count-tomorrow').innerText = cTomorrow;
    document.getElementById('count-future').innerText = cFuture;
}

function renderCard(item) {
    const d = new Date(item.ngay_thuc_hien);
    const dateShow = `${d.getDate()}/${d.getMonth() + 1}`;

    return `
    <div class="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col justify-between min-h-[110px]">
        <div>
            <h4 class="font-bold text-slate-800 text-[12px] leading-tight truncate">${item.ten_khach}</h4>
            <p class="text-[10px] text-blue-600 font-bold mt-1 uppercase">${item.loai_dich_vu.split(' ')[0]}</p>
            <p class="text-[9px] text-slate-500 truncate">${item.dia_chi || '...'}</p>
            <p class="text-[9px] text-orange-600 font-medium">Thợ: ${item.nguoi_phu_trach || 'Chưa rõ'}</p>
        </div>
        <div class="flex gap-1 mt-2">
            <a href="tel:${item.so_dien_thoai}" class="flex-1 bg-blue-100 text-blue-600 py-2 rounded flex items-center justify-center text-[10px]">
                <i class="fas fa-phone"></i>
            </a>
            <button onclick="window.finishJob('${item.id}')" class="flex-1 bg-emerald-500 text-white py-2 rounded flex items-center justify-center text-[10px]">
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
        dia_chi: document.getElementById('inpDiaChi').value.trim(),
        nguoi_phu_trach: document.getElementById('inpTho').value, // Khớp với SQL ALTER TABLE
        loai_dich_vu: document.getElementById('inpDichVu').value,
        ngay_thuc_hien: document.getElementById('inpNgay').value,
        trang_thai: 'CTY'
    };

    if (!newData.ten_khach || !newData.ngay_thuc_hien) {
        alert("Vui lòng nhập Tên và Ngày hẹn!");
        return;
    }

    btn.disabled = true;
    btn.innerText = "ĐANG LƯU...";

    const { data, error } = await db.insert(newData);

    if (error) {
        alert("Lỗi lưu Database: " + error.message);
        console.error(error);
    } else {
        // HIỆN THÔNG BÁO KHI LƯU XONG
        alert("Đã Lưu Lịch Thành Công!");
        
        // Reset form
        document.getElementById('inpTen').value = '';
        document.getElementById('inpSdt').value = '';
        document.getElementById('inpDiaChi').value = '';
        
        // Tải lại lịch trình
        loadData();
    }
    
    btn.disabled = false;
    btn.innerText = "Lên Lịch Ngay";
};

window.finishJob = async (id) => {
    if(confirm("Xác nhận đã xong việc?")) {
        await db.updateStatus(id, 'XONG');
        loadData();
    }
};

loadData();
