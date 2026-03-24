import { db } from './supabase.js';

// ==========================================
// [1] ĐỒNG HỒ & KHỞI TẠO NGÀY
// ==========================================
setInterval(() => { 
    const clock = document.getElementById('clock');
    if(clock) clock.innerText = new Date().toLocaleString('vi-VN'); 
}, 1000);

const getTodayStr = () => new Date().toLocaleDateString('sv-SE');
const inpNgay = document.getElementById('inpNgay');
if(inpNgay) inpNgay.value = getTodayStr();

// Hàm lấy Thứ và Ngày Tháng Việt Nam
function formatVN(dateStr) {
    const d = new Date(dateStr);
    const days = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    const ngay = d.getDate().toString().padStart(2,'0');
    const thang = (d.getMonth()+1).toString().padStart(2,'0');
    return `${days[d.getDay()]} - ${ngay}/${thang}`;
}

// ==========================================
// [2] TẢI VÀ CHIA CỘT DỮ LIỆU (4 CỘT PC)
// ==========================================
export async function loadData() {
    const { data, error } = await db.fetchAll();
    if (error) return;

    const todayStr = getTodayStr();
    const tomDate = new Date(); tomDate.setDate(tomDate.getDate() + 1);
    const tomorrowStr = tomDate.toLocaleDateString('sv-SE');

    // Gom nhóm task theo từng ngày
    const grouped = data.reduce((acc, item) => {
        const d = item.ngay_thuc_hien;
        if (!acc[d]) acc[d] = [];
        acc[d].push(item);
        return acc;
    }, {});

    // Luôn hiển thị cột Hôm nay và Ngày mai dù trống
    if (!grouped[todayStr]) grouped[todayStr] = [];
    if (!grouped[tomorrowStr]) grouped[tomorrowStr] = [];

    const sortedDates = Object.keys(grouped).sort();

    let finalHtml = '';
    sortedDates.forEach(date => {
        if (date < todayStr) return; // Ẩn các ngày đã qua

        const tasks = grouped[date];
        let titlePrefix = formatVN(date);
        
        if (date === todayStr) titlePrefix = "HÔM NAY - " + titlePrefix;
        else if (date === tomorrowStr) titlePrefix = "NGÀY MAI - " + titlePrefix;

        const colorClass = (date === todayStr) ? "bg-blue-700" : (date === tomorrowStr ? "bg-slate-700" : "bg-slate-500");

        finalHtml += `
            <div class="flex-shrink-0 w-[300px] md:w-[320px] lg:w-[350px] space-y-3">
                <div class="${colorClass} p-3 text-white text-[11px] font-bold uppercase rounded-t-xl flex justify-between items-center shadow-md">
                    <span>${titlePrefix}</span>
                    <span class="bg-white text-slate-800 px-2 py-0.5 rounded-full text-[10px]">${tasks.length} VIỆC</span>
                </div>
                <div class="space-y-2">
                    ${tasks.map(i => renderCard(i)).join('') || '<p class="text-[10px] text-slate-300 text-center py-8 bg-white rounded-lg border border-dashed italic">Trống lịch</p>'}
                </div>
            </div>
        `;
    });

    const container = document.getElementById('main-grid-container');
    if(container) container.innerHTML = finalHtml;
}

function renderCard(item) {
    const isDone = item.trang_thai === 'XONG';
    const cardClass = isDone ? 'task-done shadow-none' : 'bg-white border-slate-200 shadow-sm';
    
    return `
    <div class="${cardClass} p-3 rounded-lg border transition-all hover:border-blue-400">
        <div class="flex justify-between items-start">
            <div class="flex-1 overflow-hidden">
                <h4 class="font-bold text-slate-800 text-[13px] truncate">
                    ${item.ten_khach} 
                    <a href="tel:${item.so_dien_thoai}" class="text-blue-600 ml-1"><i class="fas fa-phone-alt text-[10px]"></i></a>
                </h4>
                <p class="text-[10px] text-slate-500 truncate italic">${item.khu_vuc ? `[${item.khu_vuc}] ` : ''}${item.dia_chi}</p>
                <p class="text-[9px] text-blue-500 mt-1 font-bold">Thợ: ${item.nguoi_phu_trach}</p>
            </div>
            <span class="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded uppercase shrink-0">${item.loai_dich_vu}</span>
        </div>
        <div class="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
            <p class="text-[9px] text-slate-400 truncate flex-1 mr-2">${item.ghi_chu_cong_viec && !isDone ? item.ghi_chu_cong_viec : ''}</p>
            ${isDone ? 
                `<span class="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
                    <i class="fas fa-check-circle mr-1"></i> Xong: ${item.ghi_chu_cong_viec}
                </span>` : 
                `<button onclick="window.finishJob('${item.id}')" class="bg-emerald-600 text-white text-[9px] px-3 py-1.5 rounded font-bold hover:bg-emerald-700 shadow-sm transition-all">HOÀN THÀNH</button>`
            }
        </div>
    </div>`;
}

// ==========================================
// [3] LƯU VÀ HOÀN THÀNH
// ==========================================
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
            ghi_chu_cong_viec: document.getElementById('inpGhiChu').value.trim(),
            trang_thai: 'CTY'
        };
        if(!newData.ten_khach) return alert("Nhập tên khách!");
        btnSave.disabled = true;
        const { error } = await db.insert(newData);
        if (!error) { 
            await loadData(); 
            ["inpTen", "inpSdt", "inpDiaChi", "inpGhiChu"].forEach(id => document.getElementById(id).value = ''); 
        }
        btnSave.disabled = false;
    };
}

window.finishJob = async (id) => {
    const n = new Date();
    const timeText = `${n.getHours()}:${n.getMinutes().toString().padStart(2,'0')} (${n.getDate()}/${n.getMonth()+1})`;
    if(confirm("Xác nhận hoàn thành việc này?")) {
        const { error } = await db.from('DATA-KHACH-HANG').update({ trang_thai: 'XONG', ghi_chu_cong_viec: timeText }).eq('id', id);
        if(!error) await loadData();
    }
};

loadData();
