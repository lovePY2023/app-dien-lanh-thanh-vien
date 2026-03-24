import { db } from './supabase.js';

// Hàm khởi tạo POS
export async function initPOS() {
    const grid = document.getElementById('product-grid');
    const catContainer = document.getElementById('pos-categories');
    if (!grid) return;

    grid.innerHTML = `<div class="col-span-full text-center py-10 text-xs text-slate-400">Đang tải kho hàng...</div>`;

    // 1. Lấy dữ liệu thực từ Table DM-HANG-HOA
    const { data, error } = await db.from('DM-HANG-HOA').select('*').order('ten_hang');
    
    if (error) {
        grid.innerHTML = `<div class="col-span-full text-red-500 text-[10px]">Lỗi kho: ${error.message}</div>`;
        return;
    }

    // 2. Tự động tạo danh mục (Categories) từ dữ liệu
    const categories = ['TẤT CẢ', ...new Set(data.map(item => item.danh_muc))];
    catContainer.innerHTML = categories.map(c => `
        <button onclick="window.filterPOS('${c}')" class="bg-white text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-bold border whitespace-nowrap shadow-sm active:bg-orange-600 active:text-white">
            ${c}
        </button>
    `).join('');

    // 3. Lưu biến global để filter nhanh không cần load lại DB
    window.allProducts = data;
    renderGrid(data);
}

// Hàm vẽ lưới hàng hóa
function renderGrid(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => {
        const outOfStock = p.so_luong_ton <= 0;
        return `
        <button 
            onclick="${outOfStock ? '' : `window.confirmSale('${p.ma_hang}', '${p.ten_hang}', ${p.gia_ban}, ${p.so_luong_ton})`}"
            class="${outOfStock ? 'opacity-40 grayscale' : 'active:scale-95'} bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-left relative transition-all flex flex-col justify-between h-24"
        >
            <span class="absolute top-0 right-0 ${outOfStock ? 'bg-red-600' : 'bg-emerald-500'} text-white text-[7px] px-1.5 rounded-bl font-bold">
                ${outOfStock ? 'HẾT' : `Tồn: ${p.so_luong_ton}`}
            </span>
            <div>
                <p class="text-[7px] text-slate-400 font-bold uppercase">${p.ma_hang}</p>
                <p class="text-[10px] font-black text-slate-800 uppercase leading-tight mt-0.5">${p.ten_hang}</p>
            </div>
            <p class="text-[9px] text-orange-600 font-black">${Number(p.gia_ban).toLocaleString()}đ</p>
        </button>`;
    }).join('');
}

// Hàm lọc theo danh mục
window.filterPOS = (cat) => {
    const filtered = cat === 'TẤT CẢ' ? window.allProducts : window.allProducts.filter(p => p.danh_muc === cat);
    renderGrid(filtered);
};

// Hàm xử lý bán hàng (Trừ kho & Ghi nhật ký)
window.confirmSale = async (ma, ten, gia, tonHienTai) => {
    const khach = document.getElementById('posTen').value.trim();
    if (!khach) return alert("Phải nhập tên khách hàng trước!");

    if (confirm(`Bán [${ten}] cho khách [${khach}]?`)) {
        // 1. Ghi vào bảng XUAT-NHAP-TON
        const { error: logError } = await db.from('XUAT-NHAP-TON').insert([{
            ma_hang: ma,
            ten_hang: ten,
            loai_giao_dich: 'XUẤT',
            so_luong: 1,
            gia_ban: gia,
            khach_hang: khach,
            ghi_chu: 'Bán lẻ qua POS'
        }]);

        if (logError) return alert("Lỗi ghi nhật ký: " + logError.message);

        // 2. Cập nhật trừ kho ở DM-HANG-HOA
        await db.from('DM-HANG-HOA').update({ so_luong_ton: tonHienTai - 1 }).eq('ma_hang', ma);

        alert("Đã trừ kho và lên đơn thành công!");
        initPOS(); // Load lại grid để cập nhật số tồn mới
    }
};
