const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 获取献血者列表（支持分页和搜索）
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', blood_type = '', status = '' } = req.query;
    const offset = (page - 1) * pageSize;
    
    let sql = 'SELECT * FROM donors WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM donors WHERE 1=1';
    let params = [];
    let countParams = [];
    
    if (keyword) {
      sql += ' AND (name LIKE ? OR donor_no LIKE ? OR phone LIKE ? OR id_card LIKE ?)';
      countSql += ' AND (name LIKE ? OR donor_no LIKE ? OR phone LIKE ? OR id_card LIKE ?)';
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword, searchKeyword, searchKeyword);
      countParams.push(searchKeyword, searchKeyword, searchKeyword, searchKeyword);
    }
    
    if (blood_type) {
      sql += ' AND blood_type = ?';
      countSql += ' AND blood_type = ?';
      params.push(blood_type);
      countParams.push(blood_type);
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
    console.error('获取献血者列表失败:', error);
    res.status(500).json({ code: 500, message: '获取献血者列表失败' });
  }
});

// 获取单个献血者详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM donors WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '献血者不存在' });
    }
    
    res.json({ code: 200, message: '获取成功', data: rows[0] });
  } catch (error) {
    console.error('获取献血者详情失败:', error);
    res.status(500).json({ code: 500, message: '获取献血者详情失败' });
  }
});

// 添加献血者
router.post('/', async (req, res) => {
  try {
    const { donor_no, name, gender, age, id_card, phone, blood_type, rh_factor, address, remark } = req.body;
    
    if (!donor_no || !name || !gender || !age || !id_card) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }
    
    const [existing] = await pool.execute('SELECT id FROM donors WHERE donor_no = ? OR id_card = ?', [donor_no, id_card]);
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '献血者编号或身份证号已存在' });
    }
    
    const sql = `INSERT INTO donors (donor_no, name, gender, age, id_card, phone, blood_type, rh_factor, address, remark) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.execute(sql, [donor_no, name, gender, age, id_card, phone, blood_type || '未知', rh_factor || '未知', address, remark]);
    
    res.json({ code: 200, message: '添加成功', data: { id: result.insertId } });
  } catch (error) {
    console.error('添加献血者失败:', error);
    res.status(500).json({ code: 500, message: '添加献血者失败' });
  }
});

// 更新献血者
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, age, phone, blood_type, rh_factor, address, status, remark } = req.body;
    
    const [existing] = await pool.execute('SELECT id FROM donors WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '献血者不存在' });
    }
    
    const sql = `UPDATE donors SET name = ?, gender = ?, age = ?, phone = ?, blood_type = ?, rh_factor = ?, address = ?, status = ?, remark = ? 
                 WHERE id = ?`;
    await pool.execute(sql, [name, gender, age, phone, blood_type, rh_factor, address, status, remark, id]);
    
    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新献血者失败:', error);
    res.status(500).json({ code: 500, message: '更新献血者失败' });
  }
});

// 删除献血者
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [bloodUnits] = await pool.execute('SELECT id FROM blood_units WHERE donor_id = ?', [id]);
    if (bloodUnits.length > 0) {
      return res.status(400).json({ code: 400, message: '该献血者有献血记录，无法删除' });
    }
    
    await pool.execute('DELETE FROM donors WHERE id = ?', [id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除献血者失败:', error);
    res.status(500).json({ code: 500, message: '删除献血者失败' });
  }
});

// 获取献血者献血历史
router.get('/:id/donations', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM blood_units WHERE donor_id = ? ORDER BY collection_date DESC', [id]);
    res.json({ code: 200, message: '获取成功', data: rows });
  } catch (error) {
    console.error('获取献血历史失败:', error);
    res.status(500).json({ code: 500, message: '获取献血历史失败' });
  }
});

module.exports = router;
