const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 获取检测列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', overall_result = '', blood_type = '' } = req.query;
    const offset = (page - 1) * pageSize;
    
    let sql = `SELECT bt.*, bu.donor_name, bu.component_type, bu.collection_date 
               FROM blood_tests bt 
               LEFT JOIN blood_units bu ON bt.blood_unit_id = bu.id 
               WHERE 1=1`;
    let countSql = 'SELECT COUNT(*) as total FROM blood_tests WHERE 1=1';
    let params = [];
    let countParams = [];
    
    if (keyword) {
      sql += ' AND (bt.blood_no LIKE ? OR bu.donor_name LIKE ?)';
      countSql += ' AND blood_no LIKE ?';
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword);
      countParams.push(searchKeyword);
    }
    
    if (overall_result) {
      sql += ' AND bt.overall_result = ?';
      countSql += ' AND overall_result = ?';
      params.push(overall_result);
      countParams.push(overall_result);
    }
    
    if (blood_type) {
      sql += ' AND bt.blood_type = ?';
      params.push(blood_type);
    }
    
    sql += ' ORDER BY bt.created_at DESC LIMIT ? OFFSET ?';
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
    console.error('获取检测列表失败:', error);
    res.status(500).json({ code: 500, message: '获取检测列表失败' });
  }
});

// 获取待检测的血液列表
router.get('/pending/list', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM blood_units WHERE status IN ('待检测', '检测中') ORDER BY created_at ASC`
    );
    res.json({ code: 200, message: '获取成功', data: rows });
  } catch (error) {
    console.error('获取待检测血液失败:', error);
    res.status(500).json({ code: 500, message: '获取待检测血液失败' });
  }
});

// 获取单条检测记录
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT bt.*, bu.donor_name, bu.component_type, bu.volume, bu.collection_date, bu.collection_site
      FROM blood_tests bt 
      LEFT JOIN blood_units bu ON bt.blood_unit_id = bu.id 
      WHERE bt.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '检测记录不存在' });
    }
    
    res.json({ code: 200, message: '获取成功', data: rows[0] });
  } catch (error) {
    console.error('获取检测详情失败:', error);
    res.status(500).json({ code: 500, message: '获取检测详情失败' });
  }
});

// 提交检测结果
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const {
      blood_unit_id, blood_no, test_date, tester,
      blood_type, rh_factor, alt_level, alt_result,
      hbsag, hcv, hiv, syphilis, overall_result, test_items, remark
    } = req.body;
    
    if (!blood_unit_id || !blood_no || !test_date || !overall_result) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }
    
    const [existing] = await connection.execute('SELECT id, status FROM blood_units WHERE id = ?', [blood_unit_id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '血液记录不存在' });
    }
    
    const insertSql = `INSERT INTO blood_tests 
      (blood_unit_id, blood_no, test_date, tester, blood_type, rh_factor, 
       alt_level, alt_result, hbsag, hcv, hiv, syphilis, overall_result, test_items, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const [result] = await connection.execute(insertSql, [
      blood_unit_id, blood_no, test_date, tester, blood_type, rh_factor,
      alt_level, alt_result, hbsag, hcv, hiv, syphilis, overall_result, test_items, remark
    ]);
    
    const bloodStatus = overall_result === '合格' ? '合格' : '不合格';
    await connection.execute(
      'UPDATE blood_units SET status = ?, blood_type = ?, rh_factor = ? WHERE id = ?',
      [bloodStatus, blood_type, rh_factor, blood_unit_id]
    );
    
    const trackingStatus = overall_result === '合格' ? '检测合格' : '检测不合格';
    const trackingSql = `INSERT INTO blood_tracking 
      (blood_unit_id, blood_no, status, location, operator, operate_time, remark)
      VALUES (?, ?, ?, '检验科', ?, NOW(), ?)`;
    await connection.execute(trackingSql, [
      blood_unit_id, blood_no, trackingStatus, tester, 
      overall_result === '合格' ? '所有检测项目合格' : '检测不合格'
    ]);
    
    if (overall_result === '不合格') {
      const discardNo = 'DS' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + 
                        String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      const [bloodUnit] = await connection.execute('SELECT * FROM blood_units WHERE id = ?', [blood_unit_id]);
      if (bloodUnit.length > 0) {
        await connection.execute(`INSERT INTO blood_discards 
          (discard_no, blood_unit_id, blood_no, blood_type, component_type, volume, 
           discard_reason, discard_date, operator, remark)
          VALUES (?, ?, ?, ?, ?, ?, '检测不合格', ?, ?, ?)`,
          [discardNo, blood_unit_id, blood_no, blood_type, 
           bloodUnit[0].component_type, bloodUnit[0].volume, 
           test_date, tester, '检测不合格报废']
        );
      }
    }
    
    await connection.commit();
    res.json({ code: 200, message: '检测结果提交成功', data: { id: result.insertId } });
  } catch (error) {
    await connection.rollback();
    console.error('提交检测结果失败:', error);
    res.status(500).json({ code: 500, message: '提交检测结果失败' });
  } finally {
    connection.release();
  }
});

// 更新检测结果
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      test_date, tester, blood_type, rh_factor, 
      alt_level, alt_result, hbsag, hcv, hiv, syphilis, 
      overall_result, test_items, remark
    } = req.body;
    
    const [existing] = await pool.execute('SELECT * FROM blood_tests WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '检测记录不存在' });
    }
    
    const sql = `UPDATE blood_tests SET 
      test_date = ?, tester = ?, blood_type = ?, rh_factor = ?, 
      alt_level = ?, alt_result = ?, hbsag = ?, hcv = ?, hiv = ?, syphilis = ?, 
      overall_result = ?, test_items = ?, remark = ?
      WHERE id = ?`;
    
    await pool.execute(sql, [
      test_date, tester, blood_type, rh_factor,
      alt_level, alt_result, hbsag, hcv, hiv, syphilis,
      overall_result, test_items, remark, id
    ]);
    
    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新检测结果失败:', error);
    res.status(500).json({ code: 500, message: '更新检测结果失败' });
  }
});

module.exports = router;
