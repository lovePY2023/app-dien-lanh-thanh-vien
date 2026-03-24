import { db } from './supabase.js';

// --- ĐĂNG KÝ HÀM HỆ THỐNG ---
window.toggleAddProduct = () => {
    const form = document.getElementById('form-add-product');
    if (form) {
        form.classList.toggle('hidden');
        if (window.navigator.vibrate) window.navigator.vibrate(10); // Rung nhẹ 10ms
    }
};

window.saveNewProduct = async () => {
    const ma = document.getElementById('newMa').value.trim().toUpperCase();
    const ten = document.getElementById('newTen').value.trim();
    const cat = document.getElementById('newCat').value;
    
    if (!ma || !ten) return alert("Thiếu Mã hoặc Tên hàng!");

    const data = {
        ma_hang: ma,
        ten_hang: ten,
        gia_nhap: Number(document.getElementById('newGiaNhap').value) || 0,
        gia_ban: Number(document.getElementById('newGiaBan').value) || 0,
        so_luong_ton: Number(document.getElementById('newTon').value) || 0,
        danh_muc: cat
    };

    const btn = event.target;
    btn.disabled = true;
    btn.innerText = "ĐANG LƯU...";

    const { error } = await db.from('DM-HANG-HOA').insert([data]);
    
    if (!error) {
        alert("Đã thêm thành công vào danh mục " + cat);
        window.toggleAddProduct();
        ["newMa", "newTen", "newGiaNhap", "newGiaBan", "newTon"].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = '';
        });
        initPOS(); 
    } else {
        alert("Lỗi: " + error.message);
    }
    btn.disabled = false;
    btn.innerText = "XÁC NHẬN LƯU";
};

// --- RENDER GIAO DIỆN ---
export async function initPOS() {
    const grid = document.getElementById('product-grid');
    const catContainer = document.getElementById('pos-categories');
    if (!grid) return;

    grid.innerHTML = `<div class="col-span-full text-center py-10 text-[10px] text-slate-400 italic font-bold tracking-widest animate-pulse">ĐANG QUÉT KHO THÀNH VIỄN...</div>`;

    const { data, error } = await db.from('DM-HANG-HOA').select('*').order('created_at', { ascending: false });
    
    if (error) {
        grid.innerHTML = `<div class="col-span-full text-red-500 text-center py-10">${error.message}</div>`;
        return;
    }

    // Cố định 3 danh mục theo yêu cầu của Kenny
    const fixedCats = ['TẤT CẢ', 'THẺ CÀO', 'SIM', 'VẬT TƯ'];
    catContainer.innerHTML = fixedCats.map(c => `
        <button onclick="window.filterPOS('${c}')" class="bg-white text-slate-600 px-5 py-2 rounded-full text-[10px] font-black border-2 border-slate-100 whitespace-nowrap shadow-sm active:bg-blue-600 active:text-white transition-all">
            ${c}
        </button>
    `).join('');

    window.allProducts = data || [];
    renderGrid(window.allProducts);
}

function renderGrid(products) {
    const grid = document.getElementById('product-grid');
    if (products.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 border-2 border-dashed rounded-3xl text-slate-300 text-[10px] uppercase font-bold">Chưa có hàng trong mục này</div>`;
        return;
    }

    grid.innerHTML = products.map(p => {
        const outOfStock = p.so_luong_ton <= 0;
        let catColor = "text-blue-500";
        if(p.danh_muc === 'THẺ CÀO') catColor = "text-orange-500";
        if(p.danh_muc === 'SIM') catColor = "text-emerald-500";

        return `
        <div class="relative group">
            <button 
                onclick="${outOfStock ? '' : `window.confirmSale('${p.ma_hang}', '${p.ten_hang}', ${p.gia_ban}, ${p.so_luong_ton})`}"
                class="${outOfStock ? 'opacity-40' : 'active:scale-90'} w-full bg-white p-3 rounded-2xl border-2 border-slate-50 shadow-sm text-left flex flex-col justify-between h-28 transition-all"
            >
                <span class="absolute top-0 right-0 ${outOfStock ? 'bg-slate-400' : 'bg-blue-600'} text-white text-[8px] px-2 py-0.5 rounded-bl-xl font-black">
                    ${outOfStock ? 'HẾT' : `TỒN: ${p.so_luong_ton}`}
                </span>
                <div>
                    <p class="text-[7px] font-black uppercase ${catColor}">${p.danh_muc}</p>
                    <p class="text-[11px] font-black text-slate-800 uppercase leading-tight mt-1 line-clamp-2">${p.ten_hang}</p>
                    <p class="text-[7px] text-slate-400 mt-0.5 font-mono">${p.ma_hang}</p>
                </div>
                <p class="text-[10px] text-red-600 font-black">${Number(p.gia_ban).toLocaleString()}đ</p>
            </button>
            <button onclick="window.deleteProduct('${p.ma_hang}')" class="absolute -bottom-1 -right-1 bg-white text-slate-200 hover:text-red-500 w-7 h-7 rounded-full border shadow-sm flex items-center justify-center text-[10px] transition-colors">
                <i class="fas fa-times-circle"></i>
            </button>
        </div>`;
    }).join('');
}

window.filterPOS = (cat) => {
    if (window.navigator.vibrate) window.navigator.vibrate(5);
    const filtered = cat === 'TẤT CẢ' ? window.allProducts : window.allProducts.filter(p => p.danh_muc === cat);
    renderGrid(filtered);
};

window.deleteProduct = async (ma) => {
    if (!confirm(`Xóa mã hàng [${ma}]?`)) return;
    const { error } = await db.from('DM-HANG-HOA').delete().eq('ma_hang', ma);
    if (!error) initPOS();
};

window.confirmSale = (ma, ten, gia, ton) => {
    const khach = document.getElementById('posTen').value.trim();
    if (!khach) {
        if (window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
        return alert("Vui lòng nhập tên khách hàng ở phía trên!");
    }
    alert(`Đã chọn: ${ten}`);
};
