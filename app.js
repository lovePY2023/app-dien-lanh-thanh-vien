import { db } from './supabase.js';

// Khai báo các phần tử DOM
const listContainer = document.getElementById('list-container');
const formContainer = document.getElementById('form-container');
const btnOpenForm = document.getElementById('btnOpenForm');
const btnClose = document.getElementById('btnClose');
const btnSave = document.getElementById('btnSave');
const btnRefresh = document.getElementById('btnRefresh');
const jobCount = document.getElementById('jobCount');

// --- HÀM TẢI DỮ LIỆU ---
async function loadData() {
    listContainer.innerHTML = `<div class="text-center py-10"><i class="fas fa-circle-notch animate-spin text-blue-500 text-2xl"></i></div>`;
    
    const { data, error } = await db.fetchAll();
    
    if (error) {
        listContainer.innerHTML = `<p class="text-red-500 text-center">Lỗi kết nối: ${error.message}</p>`;
        return;
    }

    jobCount.innerText = `${data.length} đơn`;

    if (data.length === 0) {
        listContainer.innerHTML = `<p class="text-slate-400 text-center py-10 text-sm">Chưa có dữ liệu khách hàng.</p>`;
        return;
    }

    listContainer.innerHTML = data.map(item => {
        // Logic tính toán bảo hành 3 ngày (rò rỉ nước)
        const ngayLam = new Date(item.ngay_thuc_hien);
        const homNay = new Date();
        const diffTime = Math.abs(homNay - ngayLam);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isWarranty = diffDays <= 3;

        return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
            ${isWarranty ? '<div class="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-3 py-1 font-bold rounded-bl-xl uppercase tracking-wider">Hỗ trợ 3 ngày</div>' : ''}
            
            <div class="flex justify-between items-start mb-3">
                <span class="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">${item.loai_dich_vu}</span>
                <span class="text-xs text-slate-400">${new Date(item.ngay_thuc_hien).toLocaleDateString('vi-VN')}</span>
            </div>

            <h3 class="font-bold text-slate-800 text-lg mb-1">${item.ten_khach}</h3>
            <p class="text-sm text-slate-500 mb-3"><i class="fas fa-map-marker-alt mr-1"></i> ${item.dia_chi || 'Chưa cập nhật địa chỉ'}</p>
            
            <div class="grid grid-cols-2 gap-2 mt-4">
                <a href="tel:${item.so_dien_thoai}" class="bg-emerald-500 text-white text-center py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition">
                    <i class="fas fa-phone-alt"></i> GỌI ĐIỆN
                </a>
                <button onclick="window.updateStatus('${item.id}', 'HOÀN TẤT')" class="bg-slate-100 text-slate-600 py-2 rounded-xl text-sm font-bold active:scale-95 transition">
                    XONG
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// --- HÀM LƯU DỮ LIỆU ---
btnSave.onclick = async () => {
    const newData = {
        ten_khach: document.getElementById('inpTen').value.trim(),
        so_dien_thoai: document.getElementById('inpSdt').value.trim(),
        dia_chi: document.getElementById('inpDiaChi').value.trim(),
        loai_dich_vu: document.getElementById('inpDichVu').value,
        ghi_chu: document.getElementById('inpGhiChu').value.trim(),
        trang_thai: 'CTY'
    };

    if (!newData.ten_khach || !newData.so_dien_thoai) {
        alert("Vui lòng nhập Tên và Số điện thoại!");
        return;
    }

    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fas fa-spinner animate-spin"></i> ĐANG LƯU...';

    const { error } = await db.insert(newData);

    if (error) {
        alert("Lỗi khi lưu: " + error.message);
    } else {
        formContainer.classList.add('hidden');
        resetForm();
        loadData();
    }

    btnSave.disabled = false;
    btnSave.innerText = "LƯU THÔNG TIN";
};

// --- TIỆN ÍCH ---
const resetForm = () => {
    document.querySelectorAll('#form-container input, #form-container textarea').forEach(el => el.value = '');
};

btnOpenForm.onclick = () => formContainer.classList.remove('hidden');
btnClose.onclick = () => formContainer.classList.add('hidden');
btnRefresh.onclick = () => loadData();

// Phơi bày hàm ra Global để nút bấm trong chuỗi HTML có thể gọi được
window.updateStatus = async (id, status) => {
    const { error } = await db.updateStatus(id, status);
    if (error) alert(error.message);
    else loadData();
};

// Chạy lần đầu
loadData();
