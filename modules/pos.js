import { db } from './supabase.js';

// Danh mục hàng hóa mẫu (Sau này có thể lấy từ DB)
const categories = ["TẤT CẢ", "MÁY LẠNH", "CAMERA", "LINH KIỆN", "VẬT TƯ"];

const products = [
    { id: 1, ma: 'GAS-R32', ten: 'GAS R32', gia: 250000, ton: 15, cat: 'VẬT TƯ' },
    { id: 2, ma: 'REMOTE', ten: 'REMOTE ĐN', gia: 120000, ton: 5, cat: 'LINH KIỆN' },
    { id: 3, ma: 'CAM-IMOU', ten: 'IMOU 2MP', gia: 850000, ton: 8, cat: 'CAMERA' },
    { id: 4, ma: 'ONG-DONG', ten: 'ỐNG ĐỒNG 6/10', gia: 160000, ton: 50, cat: 'VẬT TƯ' },
];

export function initPOS() {
    renderCategories();
    renderProducts(products);
}

function renderCategories() {
    const container = document.getElementById('pos-categories');
    if(!container) return;
    container.innerHTML = categories.map(c => `
        <button onclick="window.filterPOS('${c}')" class="category-btn bg-white text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-bold border whitespace-nowrap shadow-sm active:bg-orange-600 active:text-white transition-all">
            ${c}
        </button>
    `).join('');
}

window.filterPOS = (cat) => {
    const filtered = cat === "TẤT CẢ" ? products : products.filter(p => p.cat === cat);
    renderProducts(filtered);
};

function renderProducts(data) {
    const grid = document.getElementById('product-grid');
    if(!grid) return;
    grid.innerHTML = data.map(p => `
        <button onclick="window.addToCart('${p.ma}', ${p.gia})" class="bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-left relative active:scale-95 transition-all">
            <span class="absolute top-0 right-0 ${p.ton > 5 ? 'bg-emerald-500' : 'bg-red-500'} text-white text-[7px] px-1 rounded-bl">Tồn: ${p.ton}</span>
            <p class="text-[9px] font-black text-slate-800 uppercase leading-tight mt-1">${p.ten}</p>
            <p class="text-[8px] text-orange-600 font-bold mt-1">${p.gia.toLocaleString()}đ</p>
        </button>
    `).join('');
}

window.addToCart = (sku, price) => {
    const customer = document.getElementById('posTen').value;
    if(!customer) return alert("Vui lòng nhập tên khách hàng trước khi chọn hàng!");
    
    if(confirm(`Xác nhận bán ${sku} cho khách ${customer}?`)) {
        alert(`Đã lên đơn thành công cho ${sku}`);
        // Logic insert vào DATA-BAN-HANG sẽ viết ở đây
    }
};
