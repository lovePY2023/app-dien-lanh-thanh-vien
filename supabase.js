import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'

// Khởi tạo kết nối tới Supabase
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

export const db = {
    /**
     * Lấy toàn bộ danh sách khách hàng
     * Sắp xếp theo ID giảm dần (mới nhất lên đầu)
     */
    async fetchAll() {
        const { data, error } = await supabase
            .from(CONFIG.TABLE_NAME)
            .select('*')
            .order('id', { ascending: false });
        return { data, error };
    },

    /**
     * Thêm một khách hàng mới vào bảng DATA-KHACH-HANG
     * @param {Object} customerData - Đối tượng chứa thông tin khách
     */
    async insert(customerData) {
        const { data, error } = await supabase
            .from(CONFIG.TABLE_NAME)
            .insert([customerData]);
        return { data, error };
    },

    /**
     * Cập nhật trạng thái công việc (Ví dụ: Từ CTY sang HOÀN TẤT)
     * @param {number|string} id - ID của dòng cần sửa
     * @param {string} status - Trạng thái mới
     */
    async updateStatus(id, status) {
        const { data, error } = await supabase
            .from(CONFIG.TABLE_NAME)
            .update({ trang_thai: status })
            .eq('id', id);
        return { data, error };
    },

    /**
     * Tìm kiếm khách hàng theo số điện thoại (Hữu ích để tra cứu nhanh)
     * @param {string} phone - Số điện thoại cần tìm
     */
    async searchByPhone(phone) {
        const { data, error } = await supabase
            .from(CONFIG.TABLE_NAME)
            .select('*')
            .ilike('so_dien_thoai', `%${phone}%`);
        return { data, error };
    }
};
