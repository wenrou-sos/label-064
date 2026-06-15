const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 获取用血申请列表
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { 
      keyword = '', status = '', urgency = '', blood_type = '' 
    } = req.query;
    const offset = (page - 1) * pageSize;
    
    let sql = 'SELECT * FROM blood_requests WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM blood_requests WHERE 1=1';
    let params = [];
    let countParams = [];
    
    if (keyword) {
      sql += ' AND (request_no LIKE ? OR hospital_name LIKE ? OR patient_name LIKE ?)';
      countSql += ' AND (request_no LIKE ? OR hospital_name LIKE ? OR patient_name LIKE ?)';
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword, searchKeyword);
      countParams.push(searchKeyword, searchKeyword, searchKeyword);
    }
    
    if (status) {
      sql += ' AND status = ?';
      countSql += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }
    
    if (urgency) {
      sql += ' AND urgency = ?';
      countSql += ' AND urgency = ?';
      params.push(urgency);
      countParams.push(urgency);
    }
    
    if (blood_type) {
      sql += ' AND patient_blood_type = ?';
      countSql += ' AND patient_blood_type = ?';
      params.push(blood_type);
      countParams.push(blood_type);
    }
    
    sql += ' ORDER BY FIELD(urgency, "紧急", "加急", "常规"), created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    
    const [rows] = await pool.query(sql, params);
    const [countResult] = await pool.query(countSql, countParams);
    
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
    console.error('获取用血申请列表失败:', error);
    res.status(500).json({ code: 500, message: '获取用血申请列表失败' });
  }
});

// 获取单条申请详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '申请记录不存在' });
    }
    
    const [issues] = await pool.query(`
      SELECT bi.*, 
             (SELECT COUNT(*) FROM blood_issue_items bii WHERE bii.issue_id = bi.id) as item_count
      FROM blood_issues bi 
      WHERE bi.request_id = ?
      ORDER BY bi.issue_date DESC
    `, [id]);
    
    res.json({ code: 200, message: '获取成功', data: { ...rows[0], issues } });
  } catch (error) {
    console.error('获取申请详情失败:', error);
    res.status(500).json({ code: 500, message: '获取申请详情失败' });
  }
});

// 提交用血申请
router.post('/', async (req, res) => {
  try {
    const {
      hospital_id, hospital_name, patient_name, patient_gender,
      patient_age, patient_blood_type, rh_factor, component_type,
      request_volume, request_units, urgency, clinical_diagnosis,
      transfusion_reason, requester, request_date, remark
    } = req.body;
    
    if (!hospital_id || !hospital_name || !patient_name || 
        !patient_blood_type || !component_type || !request_volume) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }
    
    const request_no = 'REQ' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + 
                       String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    const sql = `INSERT INTO blood_requests 
      (request_no, hospital_id, hospital_name, patient_name, patient_gender,
       patient_age, patient_blood_type, rh_factor, component_type,
       request_volume, request_units, urgency, clinical_diagnosis,
       transfusion_reason, requester, request_date, status, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '待审核', ?)`;
    
    const [result] = await pool.query(sql, [
      request_no, hospital_id, hospital_name, patient_name, patient_gender,
      patient_age, patient_blood_type, rh_factor || '阳性', component_type,
      request_volume, request_units || 1, urgency || '常规', clinical_diagnosis,
      transfusion_reason, requester, request_date || new Date().toISOString().split('T')[0], remark
    ]);
    
    res.json({ code: 200, message: '提交成功', data: { id: result.insertId, request_no } });
  } catch (error) {
    console.error('提交用血申请失败:', error);
    res.status(500).json({ code: 500, message: '提交用血申请失败' });
  }
});

// 审核用血申请
router.post('/:id/audit', async (req, res) => {
  try {
    const { id } = req.params;
    const { auditor, audit_remark, pass } = req.body;
    
    const [existing] = await pool.query('SELECT id, status FROM blood_requests WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '申请记录不存在' });
    }
    
    if (existing[0].status !== '待审核') {
      return res.status(400).json({ code: 400, message: '当前状态不允许审核' });
    }
    
    const newStatus = pass ? '已审核' : '已取消';
    await pool.query(
      'UPDATE blood_requests SET status = ?, auditor = ?, audit_time = NOW(), audit_remark = ? WHERE id = ?',
      [newStatus, auditor, audit_remark, id]
    );
    
    if (pass) {
      await pool.query(
        "UPDATE blood_requests SET status = '配血中' WHERE id = ?",
        [id]
      );
    }
    
    res.json({ code: 200, message: pass ? '审核通过' : '审核不通过' });
  } catch (error) {
    console.error('审核失败:', error);
    res.status(500).json({ code: 500, message: '审核失败' });
  }
});

// 配血 - 获取匹配的库存血液
router.get('/:id/match-blood', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [request] = await pool.query(
      'SELECT patient_blood_type, rh_factor, component_type, request_volume, request_units FROM blood_requests WHERE id = ?',
      [id]
    );
    if (request.length === 0) {
      return res.status(404).json({ code: 404, message: '申请记录不存在' });
    }
    
    const req = request[0];
    const limit = parseInt(req.request_units) * 2;
    const [matched] = await pool.query(`
      SELECT inv.* FROM inventory inv
      WHERE inv.blood_type = ? 
        AND inv.rh_factor = ? 
        AND inv.component_type = ?
        AND inv.status = '在库'
      ORDER BY inv.expire_date ASC
      LIMIT ?
    `, [req.patient_blood_type, req.rh_factor || '阳性', req.component_type, limit]);
    
    const withDaysLeft = matched.map(item => {
      const today = new Date();
      const expire = new Date(item.expire_date);
      const daysLeft = Math.ceil((expire - today) / (1000 * 60 * 60 * 24));
      return { ...item, days_left: daysLeft };
    });
    
    res.json({ 
      code: 200, 
      message: '获取成功', 
      data: { request: req, matched_blood: withDaysLeft } 
    });
  } catch (error) {
    console.error('配血失败:', error);
    res.status(500).json({ code: 500, message: '配血失败' });
  }
});

// 发血/出库
router.post('/:id/issue', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { inventory_ids, issuer, receiver, issue_date } = req.body;
    
    if (!inventory_ids || inventory_ids.length === 0) {
      return res.status(400).json({ code: 400, message: '请选择要发放的血液' });
    }
    
    const [request] = await connection.query(
      'SELECT * FROM blood_requests WHERE id = ?',
      [id]
    );
    if (request.length === 0) {
      return res.status(404).json({ code: 404, message: '申请记录不存在' });
    }
    const reqData = request[0];
    
    if (!['已审核', '配血中', '部分发血'].includes(reqData.status)) {
      return res.status(400).json({ code: 400, message: '当前状态不允许发血' });
    }
    
    const placeholders = inventory_ids.map(() => '?').join(',');
    const [inventoryItems] = await connection.query(
      `SELECT * FROM inventory WHERE id IN (${placeholders}) AND status = '在库'`,
      inventory_ids
    );
    
    if (inventoryItems.length !== inventory_ids.length) {
      return res.status(400).json({ code: 400, message: '部分库存不存在或已出库' });
    }
    
    const totalVolume = inventoryItems.reduce((sum, item) => sum + item.volume, 0);
    const totalUnits = inventoryItems.length;
    
    const issue_no = 'ISS' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + 
                     String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    const issueSql = `INSERT INTO blood_issues 
      (issue_no, request_id, request_no, hospital_id, hospital_name, 
       patient_name, issue_date, issuer, receiver, 
       total_volume, total_units, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '已发血')`;
    
    const [issueResult] = await connection.query(issueSql, [
      issue_no, id, reqData.request_no, reqData.hospital_id, reqData.hospital_name,
      reqData.patient_name, issue_date || new Date().toISOString().slice(0, 10), 
      issuer, receiver, totalVolume, totalUnits
    ]);
    
    for (const item of inventoryItems) {
      await connection.query(
        `INSERT INTO blood_issue_items 
          (issue_id, issue_no, inventory_id, blood_unit_id, blood_no, 
           blood_type, rh_factor, component_type, volume, expire_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          issueResult.insertId, issue_no, item.id, item.blood_unit_id, item.blood_no,
          item.blood_type, item.rh_factor, item.component_type, item.volume, item.expire_date
        ]
      );
      
      await connection.query(
        "UPDATE inventory SET status = '已出库' WHERE id = ?",
        [item.id]
      );
      
      await connection.query(
        "UPDATE blood_units SET status = '已出库' WHERE id = ?",
        [item.blood_unit_id]
      );
      
      await connection.query(
        `INSERT INTO blood_tracking 
          (blood_unit_id, blood_no, status, location, operator, operate_time, remark)
         VALUES (?, ?, '已出库', '血库', ?, NOW(), ?)`,
        [item.blood_unit_id, item.blood_no, issuer, `发往${reqData.hospital_name}`]
      );
      
      await connection.query(
        `INSERT INTO blood_tracking 
          (blood_unit_id, blood_no, status, location, operator, operate_time, remark)
         VALUES (?, ?, '已发往医院', ?, ?, NOW(), ?)`,
        [item.blood_unit_id, item.blood_no, reqData.hospital_name, receiver, '血液运输中']
      );
    }
    
    const newIssuedVolume = reqData.issued_volume + totalVolume;
    const newIssuedUnits = reqData.issued_units + totalUnits;
    let newStatus;
    if (newIssuedVolume >= reqData.request_volume) {
      newStatus = '已发血';
    } else {
      newStatus = '部分发血';
    }
    
    await connection.query(
      'UPDATE blood_requests SET issued_volume = ?, issued_units = ?, status = ? WHERE id = ?',
      [newIssuedVolume, newIssuedUnits, newStatus, id]
    );
    
    await connection.commit();
    res.json({ code: 200, message: '发血成功', data: { issue_id: issueResult.insertId, issue_no } });
  } catch (error) {
    await connection.rollback();
    console.error('发血失败:', error);
    res.status(500).json({ code: 500, message: '发血失败' });
  } finally {
    connection.release();
  }
});

// 确认收到血液（医院端）
router.post('/issue/:issueId/receive', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { issueId } = req.params;
    const { receiver } = req.body;
    
    const [issue] = await connection.query(
      'SELECT * FROM blood_issues WHERE id = ?',
      [issueId]
    );
    if (issue.length === 0) {
      return res.status(404).json({ code: 404, message: '发血记录不存在' });
    }
    
    const [issueItems] = await connection.query(
      'SELECT * FROM blood_issue_items WHERE issue_id = ?',
      [issueId]
    );
    
    await connection.query(
      "UPDATE blood_issues SET status = '已接收', receiver = ? WHERE id = ?",
      [receiver || issue[0].receiver, issueId]
    );
    
    for (const item of issueItems) {
      await connection.query(
        `INSERT INTO blood_tracking 
          (blood_unit_id, blood_no, status, location, operator, operate_time, remark)
         VALUES (?, ?, '已接收', ?, ?, NOW(), '医院已接收血液')`,
        [item.blood_unit_id, item.blood_no, issue[0].hospital_name, receiver || issue[0].receiver]
      );
    }
    
    await connection.commit();
    res.json({ code: 200, message: '接收成功' });
  } catch (error) {
    await connection.rollback();
    console.error('接收失败:', error);
    res.status(500).json({ code: 500, message: '接收失败' });
  } finally {
    connection.release();
  }
});

// 确认输血完成
router.post('/issue/:issueId/complete', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { issueId } = req.params;
    const { operator } = req.body;
    
    const [issue] = await connection.query(
      'SELECT * FROM blood_issues WHERE id = ?',
      [issueId]
    );
    if (issue.length === 0) {
      return res.status(404).json({ code: 404, message: '发血记录不存在' });
    }
    
    const [issueItems] = await connection.query(
      'SELECT * FROM blood_issue_items WHERE issue_id = ?',
      [issueId]
    );
    
    await connection.query(
      "UPDATE blood_issues SET status = '已使用' WHERE id = ?",
      [issueId]
    );
    
    for (const item of issueItems) {
      await connection.query(
        "UPDATE blood_units SET status = '已使用' WHERE id = ?",
        [item.blood_unit_id]
      );
      
      await connection.query(
        `INSERT INTO blood_tracking 
          (blood_unit_id, blood_no, status, location, operator, operate_time, remark)
         VALUES (?, ?, '已输血', ?, ?, NOW(), '输血完成')`,
        [item.blood_unit_id, item.blood_no, issue[0].hospital_name, operator]
      );
    }
    
    const [request] = await connection.query(
      'SELECT id, request_volume, issued_volume FROM blood_requests WHERE request_no = ?',
      [issue[0].request_no]
    );
    if (request.length > 0 && request[0].issued_volume >= request[0].request_volume) {
      await connection.query(
        "UPDATE blood_requests SET status = '已完成' WHERE id = ?",
        [request[0].id]
      );
    }
    
    await connection.commit();
    res.json({ code: 200, message: '输血完成确认成功' });
  } catch (error) {
    await connection.rollback();
    console.error('确认失败:', error);
    res.status(500).json({ code: 500, message: '确认失败' });
  } finally {
    connection.release();
  }
});

// 获取医院列表
router.get('/hospitals/list', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM hospitals WHERE status = "正常" ORDER BY name'
    );
    res.json({ code: 200, message: '获取成功', data: rows });
  } catch (error) {
    console.error('获取医院列表失败:', error);
    res.status(500).json({ code: 500, message: '获取医院列表失败' });
  }
});

module.exports = router;
