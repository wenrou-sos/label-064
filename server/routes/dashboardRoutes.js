const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 仪表盘统计数据
router.get('/stats', async (req, res) => {
  try {
    const [donorCount] = await pool.query('SELECT COUNT(*) as count FROM donors');
    
    const [todayCollection] = await pool.query(
      `SELECT COUNT(*) as units, IFNULL(SUM(volume), 0) as volume 
       FROM blood_units WHERE collection_date = CURDATE()`
    );
    
    const [pendingTests] = await pool.query(
      "SELECT COUNT(*) as count FROM blood_units WHERE status IN ('待检测', '检测中')"
    );
    
    const [inventoryStats] = await pool.query(
      `SELECT 
         COUNT(*) as total_units,
         IFNULL(SUM(volume), 0) as total_volume
       FROM inventory WHERE status = '在库'`
    );
    
    const [bloodTypeStats] = await pool.query(
      `SELECT blood_type, COUNT(*) as units, IFNULL(SUM(volume), 0) as volume
       FROM inventory WHERE status = '在库'
       GROUP BY blood_type ORDER BY blood_type`
    );
    
    const [componentStats] = await pool.query(
      `SELECT component_type, COUNT(*) as units, IFNULL(SUM(volume), 0) as volume
       FROM inventory WHERE status = '在库'
       GROUP BY component_type ORDER BY component_type`
    );
    
    const [expire7Days] = await pool.query(
      `SELECT COUNT(*) as count, IFNULL(SUM(volume), 0) as volume
       FROM inventory 
       WHERE status = '在库' AND expire_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)`
    );
    
    const [expire3Days] = await pool.query(
      `SELECT COUNT(*) as count, IFNULL(SUM(volume), 0) as volume
       FROM inventory 
       WHERE status = '在库' AND expire_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)`
    );
    
    const [pendingRequests] = await pool.query(
      "SELECT COUNT(*) as count FROM blood_requests WHERE status IN ('待审核', '已审核', '配血中', '部分发血')"
    );
    
    const [todayIssues] = await pool.query(
      `SELECT COUNT(*) as count, IFNULL(SUM(total_volume), 0) as volume
       FROM blood_issues WHERE DATE(issue_date) = CURDATE()`
    );
    
    const [monthlyTrend] = await pool.query(
      `SELECT 
         DATE_FORMAT(collection_date, '%Y-%m') as month,
         COUNT(*) as units,
         IFNULL(SUM(volume), 0) as volume
       FROM blood_units
       WHERE collection_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(collection_date, '%Y-%m')
       ORDER BY month`
    );
    
    const [recentRequests] = await pool.query(
      `SELECT * FROM blood_requests 
       ORDER BY created_at DESC LIMIT 10`
    );
    
    const [recentDonations] = await pool.query(
      `SELECT * FROM blood_units 
       ORDER BY created_at DESC LIMIT 10`
    );
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        total_donors: donorCount[0].count,
        today_collection: todayCollection[0],
        pending_tests: pendingTests[0].count,
        inventory: inventoryStats[0],
        blood_type_stats: bloodTypeStats,
        component_stats: componentStats,
        expire_7days: expire7Days[0],
        expire_3days: expire3Days[0],
        pending_requests: pendingRequests[0].count,
        today_issues: todayIssues[0],
        monthly_trend: monthlyTrend,
        recent_requests: recentRequests,
        recent_donations: recentDonations
      }
    });
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    res.status(500).json({ code: 500, message: '获取仪表盘数据失败' });
  }
});

// 血液追踪（按血液编号）
router.get('/track/:bloodNo', async (req, res) => {
  try {
    const { bloodNo } = req.params;
    
    const [bloodUnit] = await pool.query(
      'SELECT * FROM blood_units WHERE blood_no = ?',
      [bloodNo]
    );
    
    if (bloodUnit.length === 0) {
      return res.status(404).json({ code: 404, message: '未找到该血液记录' });
    }
    
    const [tracking] = await pool.query(
      'SELECT * FROM blood_tracking WHERE blood_no = ? ORDER BY operate_time ASC',
      [bloodNo]
    );
    
    const [testInfo] = await pool.query(
      'SELECT * FROM blood_tests WHERE blood_no = ? ORDER BY created_at DESC LIMIT 1',
      [bloodNo]
    );
    
    const [inventoryInfo] = await pool.query(
      'SELECT * FROM inventory WHERE blood_no = ?',
      [bloodNo]
    );
    
    const [issueInfo] = await pool.query(
      `SELECT bii.*, bi.issue_no, bi.hospital_name, bi.patient_name, bi.issue_date
       FROM blood_issue_items bii
       LEFT JOIN blood_issues bi ON bii.issue_id = bi.id
       WHERE bii.blood_no = ?
       ORDER BY bi.issue_date DESC LIMIT 1`,
      [bloodNo]
    );
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        blood_unit: bloodUnit[0],
        tracking_history: tracking,
        test_info: testInfo[0] || null,
        inventory_info: inventoryInfo[0] || null,
        issue_info: issueInfo[0] || null
      }
    });
  } catch (error) {
    console.error('血液追踪失败:', error);
    res.status(500).json({ code: 500, message: '血液追踪失败' });
  }
});

module.exports = router;
