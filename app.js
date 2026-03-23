import { db } from './supabase.js';

// ==========================================
// [HÀM HỖ TRỢ: ĐỒNG HỒ & KHỞI TẠO]
// ==========================================
setInterval(() => { 
    document.getElementById('clock').innerText = new Date().toLocaleString('vi-VN'); 
}, 1000);

// Đặt ngày mặc định là hôm nay (theo múi giờ VN)
const todayLocal = new Date().toLocaleDateString('sv-SE'); // Định dạng yyyy-mm-dd
document.getElementById('inpNgay').value = todayLocal;


// ==========================================
// [HÀM CHÍNH: TẢI VÀ PHÂN LOẠI DỮ LIỆU]
// ==========================================
async function loadData() {
    const { data, error } = await db.fetchAll();
    if (error) return;

    // Thiết lập mốc thời gian chuẩn để so sánh ngày
    const now = new Date();
    const todayStr = now.toLocaleDateString('sv-SE');
    
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('sv-SE');

    let groups = { today: '', tomorrow: '', future: '' };
    let counts = { today: 0, tomorrow: 0, future: 0 };

    data.forEach(item => {
        const card = renderCard(item);
        const itemDate = item.ngay_thuc_hien;

        if (itemDate === todayStr) {
            groups.today += card; counts.today++;
        } else if (itemDate === tomorrowStr) {
            groups.tomorrow += card; counts.tomorrow++;
        } else if (itemDate > tomorrowStr) {
            groups.future += card; counts.future++;
        }
    });

    // Cập nhật giao diện
    document.getElementById('group-today').innerHTML = groups.today;
    document.getElementById('group-tomorrow').innerHTML = groups.tomorrow;
    document.getElementById('group-future').innerHTML = groups.future;
    
    document.getElementById('count-today').innerText = counts.today;
    document.getElementById('count-tomorrow').innerText = counts.tomorrow;
    document.getElementById('count-future').innerText = counts.future;
}


// ==========================================
// [HÀM VẼ GIAO DIỆN TASK (CARD)]
// ==========================================
function renderCard(item) {
    const isDone = item.trang_thai === 'XONG';
    const cardClass = isDone ? 'task-done' : 'bg-white border-slate-200 shadow-sm';
    
    // Xử lý hiển thị Thứ và Ngày Tháng cho cột Sắp tới
    const d = new Date(item.ngay_thuc_hien);
    const days = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    const thuNgayThang = `${days[d.getDay()]} (${d.getDate()}/${d.getMonth()+1})`;

    return `
    <div class="${cardClass} p-3 rounded-lg border transition-all">
        <div class="flex justify-between items-start">
            <div class="flex-1 overflow-hidden">
                <h4 class="font-bold text-slate-800 text-[13px] flex items-center gap-1">
                    ${item.ten_khach} 
                    <a href="tel:${item.so_dien_thoai}" class="text-blue-600"><i class="fas fa-phone-alt text-[10px]"></i></a>
                </h4>
                <p class="text-[10px] text-slate-500 truncate">${item.khu_vuc ? `[${item.khu_vuc}] ` : ''}${item.dia_chi}</p>
                <p class="text-[9px] text-slate-400 font-medium">${thuNgayThang}</p>
            </div>
            <span class="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded uppercase">${item.loai_dich_vu}</span>
        </div>
        
        <div class="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
            <span class="text-[9px] text-slate-500 italic">Thợ: ${item.nguoi_phu_trach}</span>
            
            ${isDone ? 
                `<span class="text-[9px] text-emerald-700 font-bold">
                    <i class="fas fa-check-double mr-1"></i> Xong: ${item.ghi_chu_cong_viec || ''}
                </span>` : 
                `<button onclick="window.finishJob('${item.id}')" class="bg-emerald-600 text-white text-[9px] px-2 py-1 rounded font-bold hover:bg-emerald-700">
                    HOÀN THÀNH
                </button>`
            }
        </div>
    </div>`;
}


// ==========================================
// [HÀM LƯU TASK MỚI]
// ==========================================
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

    if(!newData.ten_khach) return alert("Nhập tên khách!");

    btn.disabled = true;
    const { error } = await db.insert(newData);
    if (!error) {
        // Tự động load lại dữ liệu ngay lập tức mà không cần F5
        await loadData();
        // Reset form
        ["inpTen", "inpSdt", "inpDiaChi", "inpGhiChu"].forEach(id => document.getElementById(id).value = '');
    }
    btn.disabled = false;
};


// ==========================================
// [HÀM CẬP NHẬT HOÀN THÀNH]
// ==========================================
window.finishJob = async (id) => {
    const n = new Date();
    const timeText = `${n.getHours()}:${n.getMinutes().toString().padStart(2,'0')} (${n.getDate()}/${n.getMonth()+1})`;
    
    if(confirm("Xác nhận hoàn thành?")) {
        // Cập nhật database
        const { error } = await db.from('DATA-KHACH-HANG')
            .update({ trang_thai: 'XONG', ghi_chu_cong_viec: timeText })
            .eq('id', id);
        
        if(!error) {
            // Tự động load lại dữ liệu để cập nhật giao diện ngay lập tức
            await loadData();
        } else {
            alert("Lỗi cập nhật!");
        }
    }
};

// Khởi chạy ứng dụng
loadData();
