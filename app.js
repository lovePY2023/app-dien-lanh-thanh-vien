import { db } from './supabase.js';

// ==========================================
// [MỤC 1: ĐỒNG HỒ & KHỞI TẠO]
// ==========================================
setInterval(() => { 
    document.getElementById('clock').innerText = new Date().toLocaleString('vi-VN'); 
}, 1000);

// Lấy ngày hôm nay chuẩn yyyy-mm-dd để gán vào ô Input (bắt buộc theo chuẩn HTML5)
const todayHTML = new Date().toLocaleDateString('sv-SE'); 
document.getElementById('inpNgay').value = todayHTML;


// ==========================================
// [MỤC 2: TẢI VÀ PHÂN LOẠI DỮ LIỆU]
// ==========================================
async function loadData() {
    const { data, error } = await db.fetchAll();
    if (error) return;

    // Lấy mốc thời gian hiện tại để so sánh
    const now = new Date();
    const todayStr = now.toLocaleDateString('sv-SE'); // "2026-03-23"
    
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('sv-SE'); // "2026-03-24"

    let groups = { today: '', tomorrow: '', future: '' };
    let counts = { today: 0, tomorrow: 0, future: 0 };

    data.forEach(item => {
        const card = renderCard(item);
        const itemDate = item.ngay_thuc_hien; // Dữ liệu từ DB là yyyy-mm-dd

        // So sánh chính xác để phân vào 3 cột
        if (itemDate === todayStr) {
            groups.today += card; counts.today++;
        } else if (itemDate === tomorrowStr) {
            groups.tomorrow += card; counts.tomorrow++;
        } else if (itemDate > tomorrowStr) {
            groups.future += card; counts.future++;
        }
    });

    // Cập nhật HTML vào các cột
    document.getElementById('group-today').innerHTML = groups.today;
    document.getElementById('group-tomorrow').innerHTML = groups.tomorrow;
    document.getElementById('group-future').innerHTML = groups.future;
    
    document.getElementById('count-today').innerText = counts.today;
    document.getElementById('count-tomorrow').innerText = counts.tomorrow;
    document.getElementById('count-future').innerText = counts.future;
}


// ==========================================
// [MỤC 3: VẼ GIAO DIỆN TASK (ĐỊNH DẠNG DD/MM/YYYY)]
// ==========================================
function renderCard(item) {
    const isDone = item.trang_thai === 'XONG';
    const cardClass = isDone ? 'task-done' : 'bg-white border-slate-200 shadow-sm';
    
    // XỬ LÝ NGÀY THÁNG THEO CHUẨN VIỆT NAM
    const d = new Date(item.ngay_thuc_hien);
    const days = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    const thu = days[d.getDay()];
    // Định dạng dd/mm/yyyy
    const ngayVN = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;

    return `
    <div class="${cardClass} p-3 rounded-lg border transition-all">
        <div class="flex justify-between items-start">
            <div class="flex-1 overflow-hidden">
                <h4 class="font-bold text-slate-800 text-[13px] flex items-center gap-1">
                    ${item.ten_khach} 
                    <a href="tel:${item.so_dien_thoai}" class="text-blue-600"><i class="fas fa-phone-alt text-[10px]"></i></a>
                </h4>
                <p class="text-[10px] text-slate-500 truncate">${item.khu_vuc ? `[${item.khu_vuc}] ` : ''}${item.dia_chi}</p>
                <p class="text-[9px] text-blue-500 font-bold mt-1">${thu}, ${ngayVN}</p>
            </div>
            <span class="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded uppercase">${item.loai_dich_vu}</span>
        </div>
        
        <div class="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
            <span class="text-[9px] text-slate-500 italic">Thợ: ${item.nguoi_phu_trach}</span>
            
            ${isDone ? 
                `<span class="text-[9px] text-emerald-700 font-bold">
                    <i class="fas fa-check-double mr-1"></i> Xong: ${item.ghi_chu_cong_viec || ''}
                </span>` : 
                `<button onclick="window.finishJob('${item.id}')" class="bg-emerald-600 text-white text-[9px] px-2 py-1 rounded font-bold hover:bg-emerald-700 transition-all">
                    HOÀN THÀNH
                </button>`
            }
        </div>
    </div>`;
}


// ==========================================
// [MỤC 4: LƯU TASK & TỰ CẬP NHẬT]
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

    if(!newData.ten_khach) return alert("Vui lòng nhập tên khách!");

    btn.disabled = true;
    btn.innerText = "ĐANG LƯU...";

    const { error } = await db.insert(newData);
    if (!error) {
        // Gọi lại hàm load dữ liệu ngay lập tức, không cần F5
        await loadData(); 
        ["inpTen", "inpSdt", "inpDiaChi", "inpGhiChu"].forEach(id => document.getElementById(id).value = '');
    }
    btn.disabled = false;
    btn.innerText = "Lưu";
};


// ==========================================
// [MỤC 5: HOÀN THÀNH & TỰ CẬP NHẬT]
// ==========================================
window.finishJob = async (id) => {
    const n = new Date();
    // Ghi chú thời gian xong theo kiểu Việt Nam
    const timeText = `${n.getHours()}:${n.getMinutes().toString().padStart(2,'0')} (${n.getDate()}/${n.getMonth()+1})`;
    
    if(confirm("Xác nhận hoàn thành việc này?")) {
        const { error } = await db.from('DATA-KHACH-HANG')
            .update({ trang_thai: 'XONG', ghi_chu_cong_viec: timeText })
            .eq('id', id);
        
        if(!error) {
            // Tự động load lại dữ liệu để task đổi màu ngay lập tức
            await loadData();
        } else {
            alert("Lỗi cập nhật!");
        }
    }
};

loadData();
