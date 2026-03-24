import { db } from './supabase.js';

// --- ĐĂNG KÝ HÀM VỚI WINDOW TRƯỚC KHI CHẠY ---
window.toggleAddProduct = () => {
    const form = document.getElementById('form-add-product');
    if (form) {
        form.classList.toggle('hidden');
        console.log("Đã bấm nút Thêm mã hàng");
    }
};

window.saveNewProduct = async () => {
    const btn = event.target;
    const ma = document.getElementById('newMa').value.trim().toUpperCase();
    const ten = document.getElementById('newTen').value.trim();
    
    if (!ma || !ten) return alert("Vui lòng nhập Mã và Tên hàng!");

    const data = {
        ma_hang: ma,
        ten_hang: ten,
        gia_nhap: Number(document.getElementById('newGiaNhap').value) || 0,
        gia_ban: Number(document.getElementById('newGiaBan').value) || 0,
        so_luong_ton: Number(document.getElementById('newTon').value) || 0,
        danh_muc: document.getElementById('newCat').value
    };

    btn.disabled = true;
    btn.innerText = "ĐANG LƯU...";

    const { error } = await db.from('DM-HANG-HOA').insert([data]);
    
    if (!error) {
        alert("Thêm thành công!");
        window.toggleAddProduct();
        // Xóa sạch form
        ["newMa", "newTen", "newGiaNhap", "newGiaBan", "newTon"].forEach(id => document.getElementById(id).value = '');
        initPOS(); 
    } else {
        alert("Lỗi: " + error.message);
    }
    btn.disabled = false;
    btn.innerText = "XÁC NHẬN LƯU";
};

// --- HÀM KHỞI TẠO CHÍNH ---
export async function initPOS() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    grid.innerHTML = `<div class="col-span-full text-center py-10 text-[10px] text-slate-400 italic">Đang tải kho hàng Thành Viễn...</div>`;

    try {
        const { data, error } = await db.from('DM-HANG-HOA').select('*').order('created_at', { ascending: false });
        
        if (error) throw error;

        if (!data || data.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center py-10 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <p class="text-slate-400 text-xs">Kho hàng đang trống.</p>
                <p class="text-[10px] text-blue-500 font-bold mt-2" onclick="window.toggleAddProduct()">BẤM VÀO ĐÂY ĐỂ THÊM MÃ ĐẦU TIÊN</p>
            </div>`;
            return;
        }

        renderGrid(data);
        renderCategories(data);
    } catch (err) {
        grid.innerHTML = `<div class="col-span-full text-red-500 text-xs text-center py-10">Lỗi kết nối: ${err.message}</div>`;
    }
}

function renderGrid(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => {
        const outOfStock = p.so_luong_ton <= 0;
        return `
        <div class="relative">
            <button 
                onclick="${outOfStock ? '' : `window.confirmSale('${p.ma_hang}', '${p.ten_hang}', ${p.gia_ban}, ${p.so_luong_ton})`}"
                class="${outOfStock ? 'opacity-50' : 'active:scale-95'} w-full bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm text-left flex flex-col justify-between h-24 transition-all"
            >
                <span class="absolute top-0 right-0 ${outOfStock ? 'bg-red-500' : 'bg-emerald-500'} text-white text-[7px] px-1.5 py-0.5 rounded-bl-lg font-bold">
                    ${outOfStock ? 'HẾT' : `Tồn: ${p.so_luong_ton}`}
                </span>
                <div class="pr-4">
                    <p class="text-[7px] text-slate-400 font-bold uppercase truncate">${p.ma_hang}</p>
                    <p class="text-[10px] font-extrabold text-slate-800 uppercase leading-tight mt-0.5 line-clamp-2">${p.ten_hang}</p>
                </div>
                <p class="text-[9px] text-orange-600 font-black">${Number(p.gia_ban).toLocaleString()}đ</p>
            </button>
            <button onclick="window.deleteProduct('${p.ma_hang}')" class="absolute -bottom-1 -right-1 bg-white text-slate-300 hover:text-red-500 w-6 h-6 rounded-full border shadow-sm flex items-center justify-center text-[8px]">
                <i class="fas fa-trash"></i>
            </button>
        </div>`;
    }).join('');
}

function renderCategories(data) {
    const catContainer = document.getElementById('pos-categories');
    const cats = ['TẤT CẢ', ...new Set(data.map(item => item.danh_muc))];
    catContainer.innerHTML = cats.map(c => `
        <button onclick="window.filterPOS('${c}')" class="bg-white text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-bold border whitespace-nowrap shadow-sm active:bg-orange-600 active:text-white">
            ${c}
        </button>
    `).join('');
    window.allProducts = data;
}

window.filterPOS = (cat) => {
    const filtered = cat === 'TẤT CẢ' ? window.allProducts : window.allProducts.filter(p => p.danh_muc === cat);
    renderGrid(filtered);
};

window.deleteProduct = async (ma) => {
    if (!confirm(`Xóa mã [${ma}]?`)) return;
    const { error } = await db.from('DM-HANG-HOA').delete().eq('ma_hang', ma);
    if (!error) initPOS();
    else alert("Không thể xóa mã đã có giao dịch!");
};

window.confirmSale = (ma, ten, gia, ton) => {
    const khach = document.getElementById('posTen').value.trim();
    if (!khach) return alert("Nhập tên khách hàng!");
    alert(`Bán ${ten} cho ${khach}`);
    // Logic ghi XUAT-NHAP-TON viết tiếp ở đây...
};
