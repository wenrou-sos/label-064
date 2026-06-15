const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 获取血液单位列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', blood_type = '', component_type = '', status = '' } = req.query;
    const offset = (page - 1) * pageSize;
    
    let sql = 'SELECT * FROM blood_units WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM blood_units WHERE 1=1';
    let params = [];
    let countParams = [];
    
    if (keyword) {
      sql += ' AND (blood_no LIKE ? OR donor_name LIKE ? OR donor_no LIKE ?)';
      countSql += ' AND (blood_no LIKE ? OR donor_name LIKE ? OR donor_no LIKE ?)';
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword, searchKeyword);
      countParams.push(searchKeyword, searchKeyword, searchKeyword);
    }
    
    if (blood_type) {
      sql += ' AND blood_type = ?';
      countSql += ' AND blood_type = ?';
      params.push(blood_type);
      countParams.push(blood_type);
    }
    
    if (component_type) {
      sql += ' AND component_type = ?';
      countSql += ' AND component_type = ?';
      params.push(component_type);
      countParams.push(component_type);
    }
    
    if (status) {
      sql += ' AND status = ?';
      countSql += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));
    
    const [rows] = await pool.execute(sql, params);
    const [countResult] = await pool.execute(countSql, countParams);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: rows,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取血液列表失败:', error);
    res.status(500).json({ code: 500, message: '获取血液列表失败' });
  }
});

// 获取单袋血液详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM blood_units WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '血液记录不存在' });
    }
    
    res.json({ code: 200, message: '获取成功', data: rows[0] });
  } catch (error) {
    console.error('获取血液详情失败:', error);
    res.status(500).json({ code: 500, message: '获取血液详情失败' });
  }
});

// 新增血液采集记录
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { 
      donor_id, donor_no, donor_name, collection_site, 
      collection_date, collection_time, volume, 
      blood_type, rh_factor, component_type, collector, remark 
    } = req.body;
    
    if (!donor_id || !donor_no || !donor_name || !collection_date || !volume) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }
    
    const blood_no = 'B' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + 
                     String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    const insertSql = `INSERT INTO blood_units 
      (blood_no, donor_id, donor_no, donor_name, collection_site, collection_date, collection_time, 
       volume, blood_type, rh_factor, component_type, status, collector, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '待检测', ?, ?)`;
    
    const [result] = await connection.execute(insertSql, [
      blood_no, donor_id, donor_no, donor_name, collection_site, 
      collection_date, collection_time, volume, 
      blood_type || '未知', rh_factor || '未知', component_type || '全血', 
      collector, remark
    ]);
    
    const trackingSql = `INSERT INTO blood_tracking 
      (blood_unit_id, blood_no, status, location, operator, operate_time, remark)
      VALUES (?, ?, '已采集', ?, ?, ?, ?)`;
    
    await connection.execute(trackingSql, [
      result.insertId, blood_no, collection_site, collector, 
      `${collection_date} ${collection_time}`, '血液采集完成'
    ]);
    
    const [donorResult] = await connection.execute('SELECT donate_count, total_donate_volume FROM donors WHERE id = ?', [donor_id]);
    if (donorResult.length > 0) {
      const newCount = donorResult[0].donate_count + 1;
      const newVolume = donorResult[0].total_donate_volume + parseInt(volume);
      await connection.execute(
        'UPDATE donors SET donate_count = ?, total_donate_volume = ?, last_donate_date = ? WHERE id = ?',
        [newCount, newVolume, collection_date, donor_id]
      );
    }
    
    await connection.commit();
    res.json({ code: 200, message: '采集登记成功', data: { id: result.insertId, blood_no } });
  } catch (error) {
    await connection.rollback();
    console.error('新增血液采集失败:', error);
    res.status(500).json({ code: 500, message: '新增血液采集失败' });
  } finally {
    connection.release();
  }
});

// 更新血液信息
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { collection_site, collection_date, collection_time, volume, component_type, remark } = req.body;
    
    const [existing] = await pool.execute('SELECT id FROM blood_units WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '血液记录不存在' });
    }
    
    const sql = `UPDATE blood_units SET collection_site = ?, collection_date = ?, collection_time = ?, 
                 volume = ?, component_type = ?, remark = ? WHERE id = ?`;
    await pool.execute(sql, [collection_site, collection_date, collection_time, volume, component_type, remark, id]);
    
    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新血液信息失败:', error);
    res.status(500).json({ code: 500, message: '更新血液信息失败' });
  }
});

// 根据献血者编号搜索献血者
router.get('/search/donor', async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ code: 400, message: '请输入搜索关键词' });
    }
    
    const searchKeyword = `%${keyword}%`;
    const [rows] = await pool.execute(
      'SELECT id, donor_no, name, gender, age, blood_type, rh_factor, phone, status FROM donors WHERE donor_no LIKE ? OR name LIKE ? OR id_card LIKE ? LIMIT 10',
      [searchKeyword, searchKeyword, searchKeyword]
    );
    
    res.json({ code: 200, message: '获取成功', data: rows });
  } catch (error) {
    console.error('搜索献血者失败:', error);
    res.status(500).json({ code: 500, message: '搜索献血者失败' });
  }
});

module.exports = router;
