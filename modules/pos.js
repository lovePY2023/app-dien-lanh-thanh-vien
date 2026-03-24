import { db } from './supabase.js';

// --- ĐĂNG KÝ HÀM HỆ THỐNG ---
window.toggleAddProduct = () => {
    const form = document.getElementById('form-add-product');
    if (form) {
        form.classList.toggle('hidden');
        if (window.navigator.vibrate) window.navigator.vibrate(10);
    }
};

// Hàm lưu mã hàng mới (Có kèm danh mục)
window.saveNewProduct = async () => {
    const ma = document.getElementById('newMa').value.trim().toUpperCase();
    const ten = document.getElementById('newTen').value.trim();
    const cat = document.getElementById('newCat').value;
    const giaN = Number(document.getElementById('newGiaNhap').value) || 0;
    const giaB = Number(document.getElementById('newGiaBan').value) || 0;
    const ton = Number(document.getElementById('newTon').value) || 0;

    if (!ma || !ten) return alert("Vui lòng nhập Mã và Tên hàng!");

    const btn = event.target;
    btn.disabled = true;
    btn.innerText = "ĐANG LƯU...";

    const { error } = await db.from('DM-HANG-HOA').insert([{
        ma_hang: ma,
        ten_hang: ten,
        danh_muc: cat,
        gia_nhap: giaN,
        gia_ban: giaB,
        so_luong_ton: ton
    }]);

    if (!error) {
        alert(`Đã thêm mã ${ma} vào mục ${cat}`);
        window.toggleAddProduct();
        ["newMa", "newTen", "newGiaNhap", "newGiaBan", "newTon"].forEach(id => document.getElementById(id).value = '');
        initPOS();
    } else {
        alert("Lỗi: " + error.message);
    }
    btn.disabled = false;
    btn.innerText = "XÁC NHẬN LƯU";
};

// --- KHỞI TẠO GIAO DIỆN POS ---
export async function initPOS() {
    const grid = document.getElementById('product-grid');
    const catContainer = document.getElementById('pos-categories');
    if (!grid || !catContainer) return;

    grid.innerHTML = `<div class="py-10 text-center text-[10px] font-bold text-slate-400 animate-pulse uppercase tracking-widest">Đang kết nối kho Thành Viễn...</div>`;

    // Lấy dữ liệu từ Supabase
    const { data, error } = await db.from('DM-HANG-HOA').select('*').order('ma_hang', { ascending: true });

    if (error) {
        grid.innerHTML = `<div class="text-red-500 text-center py-10">${error.message}</div>`;
        return;
    }

    // 1. Tạo hàng nút danh mục (3 loại chính)
    const cats = ['TẤT CẢ', 'THẺ CÀO', 'SIM', 'VẬT TƯ'];
    catContainer.innerHTML = cats.map(c => `
        <button onclick="window.filterPOS('${c}')" class="bg-white text-slate-600 px-5 py-2 rounded-full text-[10px] font-black border-2 border-slate-100 whitespace-nowrap shadow-sm active:bg-blue-600 active:text-white transition-all uppercase">
            ${c}
        </button>
    `).join('');

    window.allProducts = data || [];
    renderList(window.allProducts);
}

// Hàm vẽ danh sách hàng dọc
function renderList(products) {
    const grid = document.getElementById('product-grid');
    grid.className = "flex flex-col gap-1.5 pb-20"; // Chuyển sang hàng dọc

    if (products.length === 0) {
        grid.innerHTML = `<div class="py-20 text-center text-slate-300 text-[10px] font-bold border-2 border-dashed rounded-3xl uppercase">Trống danh mục này</div>`;
        return;
    }

    grid.innerHTML = products.map(p => {
        const outOfStock = p.so_luong_ton <= 0;
        return `
        <div class="flex items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm gap-3 active:bg-slate-50 transition-colors">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <span class="text-[11px] font-black text-blue-600 w-10 shrink-0">${p.ma_hang}</span>
                    <span class="text-[11px] font-bold text-slate-800 truncate">${p.ten_hang}</span>
                </div>
                <div class="flex items-center gap-3 mt-1">
                    <span class="text-[9px] font-black text-slate-400 uppercase">${p.danh_muc}</span>
                    <span class="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">TỒN: ${p.so_luong_ton}</span>
                    <span class="text-[9px] font-black text-orange-600">${Number(p.gia_ban).toLocaleString()}đ</span>
                </div>
            </div>

            <div class="flex items-center gap-1.5">
                <input type="number" id="qty-${p.ma_hang}" value="1" min="1" 
                    class="w-10 p-2 text-center text-xs font-black border-2 border-slate-100 rounded-xl bg-slate-50 outline-none focus:border-blue-500">
                
                <button 
                    onclick="window.executeSale('${p.ma_hang}', '${p.ten_hang}', ${p.gia_ban}, ${p.so_luong_ton})"
                    class="${outOfStock ? 'bg-slate-300' : 'bg-blue-600 active:scale-90'} text-white text-[9px] font-black px-4 py-2.5 rounded-xl uppercase shadow-md transition-all"
                    ${outOfStock ? 'disabled' : ''}
                >
                    BÁN
                </button>
            </div>

            <button onclick="window.deleteProduct('${p.ma_hang}')" class="text-slate-200 hover:text-red-500 transition-colors">
                <i class="fas fa-times-circle text-xs"></i>
            </button>
        </div>`;
    }).join('');
}

// --- XỬ LÝ LỌC & XÓA ---
window.filterPOS = (cat) => {
    if (window.navigator.vibrate) window.navigator.vibrate(5);
    const filtered = cat === 'TẤT CẢ' ? window.allProducts : window.allProducts.filter(p => p.danh_muc === cat);
    renderList(filtered);
};

window.executeSale = async (ma, ten, gia, tonHienTai) => {
    const khach = document.getElementById('posTen').value.trim();
    const qty = parseInt(document.getElementById(`qty-${ma}`).value);

    if (!khach) return alert("Nhập tên khách hàng!");
    if (qty > tonHienTai) return alert("Không đủ hàng!");

    if (confirm(`Bán ${qty} món [${ten}] cho ${khach}?`)) {
        // Ghi nhật ký XUẤT
        await db.from('XUAT-NHAP-TON').insert([{
            ma_hang: ma,
            ten_hang: ten,
            loai_giao_dich: 'XUẤT',
            so_luong: qty,
            gia_ban: gia,
            khach_hang: khach
        }]);

        // Cập nhật tồn kho
        await db.from('DM-HANG-HOA').update({ so_luong_ton: tonHienTai - qty }).eq('ma_hang', ma);

        alert("Giao dịch thành công!");
        initPOS();
    }
};

window.deleteProduct = async (ma) => {
    if (!confirm(`Xóa vĩnh viễn mã ${ma}?`)) return;
    const { error } = await db.from('DM-HANG-HOA').delete().eq('ma_hang', ma);
    if (!error) initPOS();
};
