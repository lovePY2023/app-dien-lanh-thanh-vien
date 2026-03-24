import { db } from './supabase.js';

// Danh sách hàng hóa mẫu cho Thành Viễn
const products = [
    { ma: 'GAS-R32', ten: 'GAS R32/KG', gia: 250000, ton: 15, cat: 'VẬT TƯ' },
    { ma: 'REMOTE', ten: 'REMOTE ĐN', gia: 120000, ton: 5, cat: 'LINH KIỆN' },
    { ma: 'CAP-1.5', ten: 'DÂY ĐIỆN 1.5', gia: 12000, ton: 100, cat: 'VẬT TƯ' },
    { ma: 'CAM-IMOU', ten: 'IMOU A2', gia: 550000, ton: 3, cat: 'CAMERA' }
];

// Phải có EXPORT để task.js gọi được
export function initPOS() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    grid.innerHTML = products.map(p => `
        <button onclick="window.addToCart('${p.ma}', ${p.gia})" class="bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-left relative active:scale-95 transition-all h-20 flex flex-col justify-between">
            <span class="absolute top-0 right-0 ${p.ton > 5 ? 'bg-emerald-500' : 'bg-red-500'} text-white text-[7px] px-1 rounded-bl">Tồn: ${p.ton}</span>
            <p class="text-[9px] font-black text-slate-800 uppercase leading-tight">${p.ten}</p>
            <p class="text-[8px] text-orange-600 font-bold">${p.gia.toLocaleString()}đ</p>
        </button>
    `).join('');
}

// Đăng ký hàm bán hàng với trình duyệt
window.addToCart = (sku, price) => {
    const customer = document.getElementById('posTen').value;
    if (!customer) return alert("Nhập tên khách trước khi chọn hàng!");
    alert(`Đã lên đơn: ${sku}\nKhách: ${customer}`);
};
