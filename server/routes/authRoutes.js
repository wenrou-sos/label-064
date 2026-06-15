const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { generateToken } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '请输入用户名和密码' });
    }
    
    const [users] = await pool.query(
      'SELECT * FROM sys_users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ code: 400, message: '用户名或密码错误' });
    }
    
    const user = users[0];
    
    if (user.status !== '正常') {
      return res.status(400).json({ code: 400, message: '账号已被禁用，请联系管理员' });
    }
    
    if (user.password !== password) {
      return res.status(400).json({ code: 400, message: '用户名或密码错误' });
    }
    
    const token = generateToken(user);
    
    await pool.query(
      'UPDATE sys_users SET last_login_time = NOW() WHERE id = ?',
      [user.id]
    );
    
    const userInfo = {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      role: user.role,
      phone: user.phone
    };
    
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: userInfo
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ code: 500, message: '登录失败' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ code: 200, message: '退出成功' });
});

module.exports = router;
