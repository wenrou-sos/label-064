const express = require('express');
const router = express.Router();
const pool = require('../config/db');

const SHELF_LIFE = {
  '全血': 35,
  '红细胞': 35,
  '血小板': 5,
  '血浆': 365,
  '冷沉淀': 365
};

// 获取库存列表
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { 
      keyword = '', blood_type = '', component_type = '', 
      status = '', expire_warning = '' 
    } = req.query;
    const offset = (page - 1) * pageSize;
    
    let sql = 'SELECT * FROM inventory WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM inventory WHERE 1=1';
    let params = [];
    let countParams = [];
    
    if (keyword) {
      sql += ' AND (blood_no LIKE ? OR storage_location LIKE ?)';
      countSql += ' AND (blood_no LIKE ? OR storage_location LIKE ?)';
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword);
      countParams.push(searchKeyword, searchKeyword);
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
    
    if (expire_warning === '7') {
      sql += ' AND expire_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)';
      countSql += ' AND expire_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)';
    } else if (expire_warning === '3') {
      sql += ' AND expire_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)';
      countSql += ' AND expire_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)';
    }
    
    sql += ' ORDER BY expire_date ASC, created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    
    const [rows] = await pool.query(sql, params);
    const [countResult] = await pool.query(countSql, countParams);
    
    const dataWithDaysLeft = rows.map(item => {
      const today = new Date();
      const expire = new Date(item.expire_date);
      const daysLeft = Math.ceil((expire - today) / (1000 * 60 * 60 * 24));
      return { ...item, days_left: daysLeft };
    });
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: dataWithDaysLeft,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取库存列表失败:', error);
    res.status(500).json({ code: 500, message: '获取库存列表失败' });
  }
});

// 获取库存统计（按血型和成分分组）
router.get('/stats/summary', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT blood_type, component_type, 
             COUNT(*) as units, 
             SUM(volume) as total_volume
      FROM inventory 
      WHERE status = '在库'
      GROUP BY blood_type, component_type
      ORDER BY blood_type, component_type
    `);
    
    const [totalStats] = await pool.query(`
      SELECT COUNT(*) as total_units, 
             SUM(volume) as total_volume
      FROM inventory 
      WHERE status = '在库'
    `);
    
    const [expire7days] = await pool.query(`
      SELECT COUNT(*) as count, SUM(volume) as volume
      FROM inventory 
      WHERE status = '在库' AND expire_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        by_type: rows,
        total: totalStats[0],
        expire_7days: expire7days[0]
      }
    });
  } catch (error) {
    console.error('获取库存统计失败:', error);
    res.status(500).json({ code: 500, message: '获取库存统计失败' });
  }
});

// 获取临期血液列表
router.get('/expiring-soon', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const [rows] = await pool.query(`
      SELECT * FROM inventory 
      WHERE status = '在库' AND expire_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY expire_date ASC
    `, [days]);
    
    const dataWithDaysLeft = rows.map(item => {
      const today = new Date();
      const expire = new Date(item.expire_date);
      const daysLeft = Math.ceil((expire - today) / (1000 * 60 * 60 * 24));
      return { ...item, days_left: daysLeft };
    });
    
    res.json({ code: 200, message: '获取成功', data: dataWithDaysLeft });
  } catch (error) {
    console.error('获取临期血液失败:', error);
    res.status(500).json({ code: 500, message: '获取临期血液失败' });
  }
});

// 获取合格待入库的血液
router.get('/pending-stock/list', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT bu.* FROM blood_units bu
      LEFT JOIN inventory inv ON bu.id = inv.blood_unit_id
      WHERE bu.status = '合格' AND inv.id IS NULL
      ORDER BY bu.created_at ASC
    `);
    res.json({ code: 200, message: '获取成功', data: rows });
  } catch (error) {
    console.error('获取待入库血液失败:', error);
    res.status(500).json({ code: 500, message: '获取待入库血液失败' });
  }
});

// 获取单条库存记录
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM inventory WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '库存记录不存在' });
    }
    
    const today = new Date();
    const expire = new Date(rows[0].expire_date);
    const daysLeft = Math.ceil((expire - today) / (1000 * 60 * 60 * 24));
    
    res.json({ code: 200, message: '获取成功', data: { ...rows[0], days_left: daysLeft } });
  } catch (error) {
    console.error('获取库存详情失败:', error);
    res.status(500).json({ code: 500, message: '获取库存详情失败' });
  }
});

// 血液入库
router.post('/stock-in', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { 
      blood_unit_id, blood_no, blood_type, rh_factor, 
      component_type, volume, storage_location, temperature, 
      storage_date, operator, remark 
    } = req.body;
    
    if (!blood_unit_id || !blood_no || !blood_type || !component_type || !volume) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }
    
    const [bloodUnit] = await connection.query(
      'SELECT id, status FROM blood_units WHERE id = ?',
      [blood_unit_id]
    );
    if (bloodUnit.length === 0) {
      return res.status(404).json({ code: 404, message: '血液记录不存在' });
    }
    if (bloodUnit[0].status !== '合格') {
      return res.status(400).json({ code: 400, message: '血液状态不是合格，无法入库' });
    }
    
    const [existingInventory] = await connection.query(
      'SELECT id FROM inventory WHERE blood_unit_id = ?',
      [blood_unit_id]
    );
    if (existingInventory.length > 0) {
      return res.status(400).json({ code: 400, message: '该血液已入库' });
    }
    
    const shelfLifeDays = SHELF_LIFE[component_type] || 35;
    const storageDate = new Date(storage_date || new Date());
    const expireDate = new Date(storageDate);
    expireDate.setDate(expireDate.getDate() + shelfLifeDays);
    
    const insertSql = `INSERT INTO inventory 
      (blood_unit_id, blood_no, blood_type, rh_factor, component_type, 
       volume, storage_location, storage_date, expire_date, 
       shelf_life_days, status, temperature, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '在库', ?, ?)`;
    
    const [result] = await connection.query(insertSql, [
      blood_unit_id, blood_no, blood_type, rh_factor, component_type,
      volume, storage_location, storageDate.toISOString().split('T')[0], 
      expireDate.toISOString().split('T')[0],
      shelfLifeDays, temperature, remark
    ]);
    
    await connection.query(
      "UPDATE blood_units SET status = '已入库' WHERE id = ?",
      [blood_unit_id]
    );
    
    const trackingSql = `INSERT INTO blood_tracking 
      (blood_unit_id, blood_no, status, location, operator, operate_time, remark)
      VALUES (?, ?, '已入库', ?, ?, NOW(), ?)`;
    await connection.query(trackingSql, [
      blood_unit_id, blood_no, storage_location || '血库', operator, '血液入库冷藏'
    ]);
    
    await connection.commit();
    res.json({ code: 200, message: '入库成功', data: { id: result.insertId } });
  } catch (error) {
    await connection.rollback();
    console.error('入库失败:', error);
    res.status(500).json({ code: 500, message: '入库失败' });
  } finally {
    connection.release();
  }
});

// 血液报废
router.post('/discard', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { inventory_id, discard_reason, discard_date, operator, approver, remark } = req.body;
    
    if (!inventory_id || !discard_reason) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }
    
    const [inventory] = await connection.query(
      'SELECT * FROM inventory WHERE id = ?',
      [inventory_id]
    );
    if (inventory.length === 0) {
      return res.status(404).json({ code: 404, message: '库存记录不存在' });
    }
    
    const inv = inventory[0];
    
    const discardNo = 'DS' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + 
                      String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    const insertSql = `INSERT INTO blood_discards 
      (discard_no, blood_unit_id, blood_no, blood_type, component_type, 
       volume, discard_reason, discard_date, operator, approver, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    await connection.query(insertSql, [
      discardNo, inv.blood_unit_id, inv.blood_no, inv.blood_type, inv.component_type,
      inv.volume, discard_reason, discard_date || new Date().toISOString().split('T')[0], 
      operator, approver, remark
    ]);
    
    await connection.query(
      "UPDATE inventory SET status = '已报废' WHERE id = ?",
      [inventory_id]
    );
    
    await connection.query(
      "UPDATE blood_units SET status = '已报废' WHERE id = ?",
      [inv.blood_unit_id]
    );
    
    const trackingSql = `INSERT INTO blood_tracking 
      (blood_unit_id, blood_no, status, location, operator, operate_time, remark)
      VALUES (?, ?, '已报废', '血库', ?, NOW(), ?)`;
    await connection.query(trackingSql, [
      inv.blood_unit_id, inv.blood_no, operator, `报废原因：${discard_reason}`
    ]);
    
    await connection.commit();
    res.json({ code: 200, message: '报废成功' });
  } catch (error) {
    await connection.rollback();
    console.error('报废失败:', error);
    res.status(500).json({ code: 500, message: '报废失败' });
  } finally {
    connection.release();
  }
});

module.exports = router;
