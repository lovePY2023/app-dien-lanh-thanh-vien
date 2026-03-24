import { db } from './supabase.js';

// --- ĐĂNG KÝ HÀM HỆ THỐNG ---
window.toggleAddProduct = () => {
    const form = document.getElementById('form-add-product');
    if (form) form.classList.toggle('hidden');
};

// --- RENDER GIAO DIỆN DẠNG DANH SÁCH (LIST) ---
export async function initPOS() {
    const grid = document.getElementById('product-grid');
    const catContainer = document.getElementById('pos-categories');
    if (!grid) return;

    grid.innerHTML = `<div class="col-span-full text-center py-10 text-[10px] text-slate-400 italic font-bold tracking-widest animate-pulse">ĐANG TẢI DANH MỤC...</div>`;

    const { data, error } = await db.from('DM-HANG-HOA').select('*').order('ma_hang', { ascending: true });
    
    if (error) {
        grid.innerHTML = `<div class="col-span-full text-red-500 text-center py-10">${error.message}</div>`;
        return;
    }

    // Cố định 3 danh mục theo yêu cầu
    const fixedCats = ['TẤT CẢ', 'THẺ CÀO', 'SIM', 'VẬT TƯ'];
    catContainer.innerHTML = fixedCats.map(c => `
        <button onclick="window.filterPOS('${c}')" class="bg-white text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-black border border-slate-200 whitespace-nowrap shadow-sm active:bg-blue-600 active:text-white transition-all">
            ${c}
        </button>
    `).join('');

    window.allProducts = data || [];
    renderList(window.allProducts);
}

function renderList(products) {
    const grid = document.getElementById('product-grid');
    // Chuyển từ Grid sang Flex-Col để hiện danh sách hàng dọc
    grid.className = "flex flex-col gap-1 pb-10"; 

    if (products.length === 0) {
        grid.innerHTML = `<p class="text-center py-10 text-slate-300 text-[10px] uppercase font-bold">Trống danh mục</p>`;
        return;
    }

    grid.innerHTML = products.map(p => {
        const outOfStock = p.so_luong_ton <= 0;
        return `
        <div class="flex items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm gap-2 active:bg-slate-50">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <span class="text-[11px] font-black text-blue-700 w-12">${p.ma_hang}</span>
                    <span class="text-[11px] font-bold text-slate-800 truncate">${p.ten_hang}</span>
                </div>
                <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">Tồn: ${p.so_luong_ton}</span>
                    <span class="text-[9px] text-orange-600 font-bold">${Number(p.gia_ban).toLocaleString()}đ</span>
                </div>
            </div>

            <div class="flex items-center gap-1">
                <input type="number" id="qty-${p.ma_hang}" value="1" min="1" max="${p.so_luong_ton}" 
                    class="w-10 p-1.5 text-center text-xs font-bold border rounded-lg bg-slate-50 outline-none focus:border-blue-500">
                
                <button 
                    onclick="window.executeSale('${p.ma_hang}', '${p.ten_hang}', ${p.gia_ban}, ${p.so_luong_ton})"
                    class="${outOfStock ? 'bg-slate-300' : 'bg-blue-600 active:bg-blue-800'} text-white text-[9px] font-black px-3 py-2 rounded-lg uppercase transition-all"
                    ${outOfStock ? 'disabled' : ''}
                >
                    BÁN
                </button>
            </div>

            <button onclick="window.deleteProduct('${p.ma_hang}')" class="text-slate-200 hover:text-red-400 p-1">
                <i class="fas fa-times-circle text-xs"></i>
            </button>
        </div>`;
    }).join('');
}

// --- XỬ LÝ BÁN HÀNG THEO SỐ LƯỢNG NHẬP ---
window.executeSale = async (ma, ten, gia, tonHienTai) => {
    const khach = document.getElementById('posTen').value.trim();
    const qtyInput = document.getElementById(`qty-${ma}`);
    const soLuongBan = parseInt(qtyInput.value);

    if (!khach) return alert("Vui lòng nhập tên khách hàng!");
    if (isNaN(soLuongBan) || soLuongBan <= 0) return alert("Số lượng không hợp lệ!");
    if (soLuongBan > tonHienTai) return alert("Không đủ hàng trong kho!");

    if (confirm(`Xác nhận bán ${soLuongBan} [${ten}]?`)) {
        // 1. Ghi nhật ký XUẤT
        const { error: logError } = await db.from('XUAT-NHAP-TON').insert([{
            ma_hang: ma,
            ten_hang: ten,
            loai_giao_dich: 'XUẤT',
            so_luong: soLuongBan,
            gia_ban: gia,
            khach_hang: khach
        }]);

        if (logError) return alert("Lỗi ghi đơn: " + logError.message);

        // 2. Trừ kho
        await db.from('DM-HANG-HOA').update({ so_luong_ton: tonHienTai - soLuongBan }).eq('ma_hang', ma);

        alert("Đã hoàn tất đơn hàng!");
        initPOS(); // Refresh danh sách
    }
};

window.filterPOS = (cat) => {
    const filtered = cat === 'TẤT CẢ' ? window.allProducts : window.allProducts.filter(p => p.danh_muc === cat);
    renderList(filtered);
};

window.deleteProduct = async (ma) => {
    if (!confirm(`Xóa mã [${ma}]?`)) return;
    const { error } = await db.from('DM-HANG-HOA').delete().eq('ma_hang', ma);
    if (!error) initPOS();
};

// Giữ lại window.saveNewProduct từ bản trước để thêm hàng...
