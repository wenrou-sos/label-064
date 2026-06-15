-- 血库管理平台数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS blood_bank DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE blood_bank;

-- 献血者表
CREATE TABLE IF NOT EXISTS donors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor_no VARCHAR(50) UNIQUE NOT NULL COMMENT '献血者编号',
  name VARCHAR(100) NOT NULL COMMENT '姓名',
  gender ENUM('男', '女') NOT NULL COMMENT '性别',
  age INT NOT NULL COMMENT '年龄',
  id_card VARCHAR(18) UNIQUE NOT NULL COMMENT '身份证号',
  phone VARCHAR(20) COMMENT '联系电话',
  blood_type ENUM('A', 'B', 'AB', 'O', '未知') DEFAULT '未知' COMMENT '血型',
  rh_factor ENUM('阳性', '阴性', '未知') DEFAULT '未知' COMMENT 'RH因子',
  address VARCHAR(255) COMMENT '住址',
  donate_count INT DEFAULT 0 COMMENT '献血次数',
  total_donate_volume INT DEFAULT 0 COMMENT '累计献血量(ml)',
  last_donate_date DATE COMMENT '上次献血日期',
  status ENUM('正常', '暂缓', '永久淘汰') DEFAULT '正常' COMMENT '状态',
  remark TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_donor_no (donor_no),
  INDEX idx_id_card (id_card),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='献血者表';

-- 血液单位表（每袋血）
CREATE TABLE IF NOT EXISTS blood_units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blood_no VARCHAR(50) UNIQUE NOT NULL COMMENT '血液编号',
  donor_id INT NOT NULL COMMENT '献血者ID',
  donor_no VARCHAR(50) NOT NULL COMMENT '献血者编号',
  donor_name VARCHAR(100) NOT NULL COMMENT '献血者姓名',
  collection_site VARCHAR(100) NOT NULL COMMENT '采集地点(采血车/献血站)',
  collection_date DATE NOT NULL COMMENT '采集日期',
  collection_time TIME NOT NULL COMMENT '采集时间',
  volume INT NOT NULL COMMENT '献血量(ml)',
  blood_type ENUM('A', 'B', 'AB', 'O', '未知') DEFAULT '未知' COMMENT '血型',
  rh_factor ENUM('阳性', '阴性', '未知') DEFAULT '未知' COMMENT 'RH因子',
  component_type ENUM('全血', '红细胞', '血小板', '血浆', '冷沉淀') DEFAULT '全血' COMMENT '血液成分类型',
  status ENUM('待检测', '检测中', '合格', '不合格', '已入库', '已出库', '已使用', '已报废') DEFAULT '待检测' COMMENT '状态',
  shelf_life_days INT COMMENT '保质期(天)',
  expire_date DATE COMMENT '过期日期',
  collector VARCHAR(50) COMMENT '采血护士',
  remark TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (donor_id) REFERENCES donors(id),
  INDEX idx_blood_no (blood_no),
  INDEX idx_donor_id (donor_id),
  INDEX idx_status (status),
  INDEX idx_blood_type (blood_type),
  INDEX idx_expire_date (expire_date),
  INDEX idx_component_type (component_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='血液单位表';

-- 血液检测表
CREATE TABLE IF NOT EXISTS blood_tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blood_unit_id INT NOT NULL COMMENT '血液单位ID',
  blood_no VARCHAR(50) NOT NULL COMMENT '血液编号',
  test_date DATE NOT NULL COMMENT '检测日期',
  tester VARCHAR(50) COMMENT '检测人员',
  blood_type ENUM('A', 'B', 'AB', 'O') COMMENT '血型鉴定结果',
  rh_factor ENUM('阳性', '阴性') COMMENT 'RH因子鉴定结果',
  alt_level DECIMAL(5,2) COMMENT '转氨酶(ALT)水平(U/L)',
  alt_result ENUM('合格', '不合格') COMMENT '转氨酶结果',
  hbsag ENUM('阴性', '阳性') COMMENT '乙肝表面抗原',
  hcv ENUM('阴性', '阳性') COMMENT '丙肝抗体',
  hiv ENUM('阴性', '阳性') COMMENT '艾滋病抗体',
  syphilis ENUM('阴性', '阳性') COMMENT '梅毒抗体',
  overall_result ENUM('合格', '不合格') COMMENT '总体检测结果',
  test_items TEXT COMMENT '检测项目明细',
  remark TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (blood_unit_id) REFERENCES blood_units(id),
  INDEX idx_blood_unit_id (blood_unit_id),
  INDEX idx_blood_no (blood_no),
  INDEX idx_overall_result (overall_result)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='血液检测表';

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blood_unit_id INT NOT NULL COMMENT '血液单位ID',
  blood_no VARCHAR(50) UNIQUE NOT NULL COMMENT '血液编号',
  blood_type ENUM('A', 'B', 'AB', 'O') NOT NULL COMMENT '血型',
  rh_factor ENUM('阳性', '阴性') NOT NULL COMMENT 'RH因子',
  component_type ENUM('全血', '红细胞', '血小板', '血浆', '冷沉淀') NOT NULL COMMENT '血液成分类型',
  volume INT NOT NULL COMMENT '容量(ml)',
  storage_location VARCHAR(100) COMMENT '存储位置',
  storage_date DATE NOT NULL COMMENT '入库日期',
  expire_date DATE NOT NULL COMMENT '过期日期',
  shelf_life_days INT NOT NULL COMMENT '保质期(天)',
  status ENUM('在库', '已预留', '已出库', '已报废') DEFAULT '在库' COMMENT '状态',
  temperature DECIMAL(4,2) COMMENT '存储温度',
  remark TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (blood_unit_id) REFERENCES blood_units(id),
  INDEX idx_blood_no (blood_no),
  INDEX idx_blood_type_component (blood_type, component_type),
  INDEX idx_status (status),
  INDEX idx_expire_date (expire_date),
  INDEX idx_storage_location (storage_location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存表';

-- 医院表
CREATE TABLE IF NOT EXISTS hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_no VARCHAR(50) UNIQUE NOT NULL COMMENT '医院编号',
  name VARCHAR(200) NOT NULL COMMENT '医院名称',
  level VARCHAR(50) COMMENT '医院等级',
  address VARCHAR(255) COMMENT '地址',
  contact_person VARCHAR(50) COMMENT '联系人',
  phone VARCHAR(20) COMMENT '联系电话',
  status ENUM('正常', '停用') DEFAULT '正常' COMMENT '状态',
  remark TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hospital_no (hospital_no),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医院表';

-- 用血申请表
CREATE TABLE IF NOT EXISTS blood_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_no VARCHAR(50) UNIQUE NOT NULL COMMENT '申请单号',
  hospital_id INT NOT NULL COMMENT '医院ID',
  hospital_name VARCHAR(200) NOT NULL COMMENT '医院名称',
  patient_name VARCHAR(100) NOT NULL COMMENT '患者姓名',
  patient_gender ENUM('男', '女') COMMENT '患者性别',
  patient_age INT COMMENT '患者年龄',
  patient_blood_type ENUM('A', 'B', 'AB', 'O') NOT NULL COMMENT '患者血型',
  rh_factor ENUM('阳性', '阴性') DEFAULT '阳性' COMMENT 'RH因子',
  component_type ENUM('全血', '红细胞', '血小板', '血浆', '冷沉淀') NOT NULL COMMENT '血液成分类型',
  request_volume INT NOT NULL COMMENT '申请血量(ml)',
  request_units INT DEFAULT 1 COMMENT '申请单位(袋)',
  urgency ENUM('常规', '紧急', '加急') DEFAULT '常规' COMMENT '紧急程度',
  clinical_diagnosis VARCHAR(255) COMMENT '临床诊断',
  transfusion_reason TEXT COMMENT '输血原因',
  requester VARCHAR(50) COMMENT '申请医生',
  request_date DATE NOT NULL COMMENT '申请日期',
  status ENUM('待审核', '已审核', '配血中', '已发血', '部分发血', '已完成', '已取消') DEFAULT '待审核' COMMENT '状态',
  issued_volume INT DEFAULT 0 COMMENT '已发血量(ml)',
  issued_units INT DEFAULT 0 COMMENT '已发血单位(袋)',
  auditor VARCHAR(50) COMMENT '审核人',
  audit_time DATETIME COMMENT '审核时间',
  audit_remark TEXT COMMENT '审核意见',
  remark TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  INDEX idx_request_no (request_no),
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_status (status),
  INDEX idx_request_date (request_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用血申请表';

-- 血液出库/发血表
CREATE TABLE IF NOT EXISTS blood_issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  issue_no VARCHAR(50) UNIQUE NOT NULL COMMENT '发血单号',
  request_id INT NOT NULL COMMENT '用血申请ID',
  request_no VARCHAR(50) NOT NULL COMMENT '申请单号',
  hospital_id INT NOT NULL COMMENT '医院ID',
  hospital_name VARCHAR(200) NOT NULL COMMENT '医院名称',
  patient_name VARCHAR(100) NOT NULL COMMENT '患者姓名',
  issue_date DATETIME NOT NULL COMMENT '发血时间',
  issuer VARCHAR(50) COMMENT '发血人',
  receiver VARCHAR(50) COMMENT '取血人',
  total_volume INT NOT NULL COMMENT '总发血量(ml)',
  total_units INT NOT NULL COMMENT '总发血单位(袋)',
  status ENUM('已发血', '已接收', '已使用', '已退回') DEFAULT '已发血' COMMENT '状态',
  remark TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES blood_requests(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  INDEX idx_issue_no (issue_no),
  INDEX idx_request_id (request_id),
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_issue_date (issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='血液出库表';

-- 出库明细表
CREATE TABLE IF NOT EXISTS blood_issue_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  issue_id INT NOT NULL COMMENT '发血单ID',
  issue_no VARCHAR(50) NOT NULL COMMENT '发血单号',
  inventory_id INT NOT NULL COMMENT '库存ID',
  blood_unit_id INT NOT NULL COMMENT '血液单位ID',
  blood_no VARCHAR(50) NOT NULL COMMENT '血液编号',
  blood_type ENUM('A', 'B', 'AB', 'O') NOT NULL COMMENT '血型',
  rh_factor ENUM('阳性', '阴性') NOT NULL COMMENT 'RH因子',
  component_type ENUM('全血', '红细胞', '血小板', '血浆', '冷沉淀') NOT NULL COMMENT '血液成分类型',
  volume INT NOT NULL COMMENT '容量(ml)',
  expire_date DATE NOT NULL COMMENT '过期日期',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES blood_issues(id),
  FOREIGN KEY (inventory_id) REFERENCES inventory(id),
  FOREIGN KEY (blood_unit_id) REFERENCES blood_units(id),
  INDEX idx_issue_id (issue_id),
  INDEX idx_blood_no (blood_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='出库明细表';

-- 血液追踪表
CREATE TABLE IF NOT EXISTS blood_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blood_unit_id INT NOT NULL COMMENT '血液单位ID',
  blood_no VARCHAR(50) NOT NULL COMMENT '血液编号',
  status ENUM('已采集', '检测中', '检测合格', '检测不合格', '已入库', '已预留', '已出库', '已发往医院', '已接收', '已输血', '已报废') NOT NULL COMMENT '状态',
  location VARCHAR(200) COMMENT '当前位置',
  operator VARCHAR(50) COMMENT '操作人',
  operate_time DATETIME NOT NULL COMMENT '操作时间',
  remark TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blood_unit_id) REFERENCES blood_units(id),
  INDEX idx_blood_unit_id (blood_unit_id),
  INDEX idx_blood_no (blood_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='血液追踪表';

-- 血液报废表
CREATE TABLE IF NOT EXISTS blood_discards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discard_no VARCHAR(50) UNIQUE NOT NULL COMMENT '报废单号',
  blood_unit_id INT NOT NULL COMMENT '血液单位ID',
  blood_no VARCHAR(50) NOT NULL COMMENT '血液编号',
  blood_type ENUM('A', 'B', 'AB', 'O') NOT NULL COMMENT '血型',
  component_type ENUM('全血', '红细胞', '血小板', '血浆', '冷沉淀') NOT NULL COMMENT '血液成分类型',
  volume INT NOT NULL COMMENT '容量(ml)',
  discard_reason VARCHAR(255) NOT NULL COMMENT '报废原因',
  discard_date DATE NOT NULL COMMENT '报废日期',
  operator VARCHAR(50) COMMENT '操作人',
  approver VARCHAR(50) COMMENT '审批人',
  remark TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blood_unit_id) REFERENCES blood_units(id),
  INDEX idx_discard_no (discard_no),
  INDEX idx_blood_no (blood_no),
  INDEX idx_discard_date (discard_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='血液报废表';

-- 系统用户表
CREATE TABLE IF NOT EXISTS sys_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码',
  real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
  role ENUM('管理员', '采血护士', '检验师', '库管员', '临床医师') NOT NULL COMMENT '角色',
  phone VARCHAR(20) COMMENT '联系电话',
  status ENUM('正常', '禁用') DEFAULT '正常' COMMENT '状态',
  last_login_time DATETIME COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- 插入初始医院数据
INSERT INTO hospitals (hospital_no, name, level, address, contact_person, phone) VALUES
('HOS001', '市第一人民医院', '三级甲等', '市中心区人民路1号', '张主任', '13800138001'),
('HOS002', '市中心医院', '三级甲等', '市中心区健康路2号', '李主任', '13800138002'),
('HOS003', '市第二人民医院', '二级甲等', '东城区建设路3号', '王主任', '13800138003'),
('HOS004', '妇幼保健院', '三级甲等', '西城区妇女街4号', '赵主任', '13800138004'),
('HOS005', '中医医院', '三级甲等', '南城区中医路5号', '刘主任', '13800138005');

-- 插入初始系统用户
INSERT INTO sys_users (username, password, real_name, role, phone) VALUES
('admin', 'admin123', '系统管理员', '管理员', '13900139000'),
('nurse01', '123456', '王护士', '采血护士', '13900139001'),
('lab01', '123456', '李检验师', '检验师', '13900139002'),
('keeper01', '123456', '张库管', '库管员', '13900139003'),
('doctor01', '123456', '刘医生', '临床医师', '13900139004');

-- 插入示例献血者数据
INSERT INTO donors (donor_no, name, gender, age, id_card, phone, blood_type, rh_factor, address, donate_count, total_donate_volume) VALUES
('D001', '张三', '男', 28, '110101199501011234', '13811111111', 'A', '阳性', '北京市朝阳区', 3, 1200),
('D002', '李四', '女', 32, '110101199102022345', '13822222222', 'B', '阳性', '北京市海淀区', 2, 800),
('D003', '王五', '男', 25, '110101199803033456', '13833333333', 'O', '阳性', '北京市西城区', 1, 400),
('D004', '赵六', '男', 35, '110101198804044567', '13844444444', 'AB', '阴性', '北京市东城区', 5, 2000),
('D005', '孙七', '女', 29, '110101199405055678', '13855555555', 'O', '阳性', '北京市丰台区', 2, 800);

-- 插入示例血液数据（待检测）
INSERT INTO blood_units (blood_no, donor_id, donor_no, donor_name, collection_site, collection_date, collection_time, volume, blood_type, rh_factor, component_type, status, collector) VALUES
('B20240115001', 1, 'D001', '张三', '中心献血站', CURDATE(), '09:30:00', 400, 'A', '阳性', '全血', '已入库', '王护士'),
('B20240115002', 2, 'D002', '李四', '流动采血车1号', CURDATE(), '10:15:00', 400, 'B', '阳性', '全血', '已入库', '王护士'),
('B20240115003', 3, 'D003', '王五', '中心献血站', CURDATE(), '11:00:00', 400, 'O', '阳性', '全血', '待检测', '王护士'),
('B20240115004', 4, 'D004', '赵六', '流动采血车2号', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '14:30:00', 400, 'AB', '阴性', '全血', '检测中', '李护士'),
('B20240115005', 5, 'D005', '孙七', '中心献血站', DATE_SUB(CURDATE(), INTERVAL 2 DAY), '09:00:00', 400, 'O', '阳性', '全血', '合格', '王护士');

-- 插入示例检测数据
INSERT INTO blood_tests (blood_unit_id, blood_no, test_date, tester, blood_type, rh_factor, alt_level, alt_result, hbsag, hcv, hiv, syphilis, overall_result) VALUES
(1, 'B20240115001', CURDATE(), '李检验师', 'A', '阳性', 25.5, '合格', '阴性', '阴性', '阴性', '阴性', '合格'),
(2, 'B20240115002', CURDATE(), '李检验师', 'B', '阳性', 30.2, '合格', '阴性', '阴性', '阴性', '阴性', '合格'),
(5, 'B20240115005', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '李检验师', 'O', '阳性', 28.0, '合格', '阴性', '阴性', '阴性', '阴性', '合格');

-- 插入示例库存数据
INSERT INTO inventory (blood_unit_id, blood_no, blood_type, rh_factor, component_type, volume, storage_location, storage_date, expire_date, shelf_life_days, status, temperature) VALUES
(1, 'B20240115001', 'A', '阳性', '全血', 400, '冷藏柜A-01', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 35 DAY), 35, '在库', 4.0),
(2, 'B20240115002', 'B', '阳性', '全血', 400, '冷藏柜A-02', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 35 DAY), 35, '在库', 4.0),
(5, 'B20240115005', 'O', '阳性', '全血', 400, '冷藏柜B-01', DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 2 DAY), INTERVAL 35 DAY), 35, '在库', 4.0);

-- 插入示例追踪数据
INSERT INTO blood_tracking (blood_unit_id, blood_no, status, location, operator, operate_time, remark) VALUES
(1, 'B20240115001', '已采集', '中心献血站', '王护士', DATE_ADD(CURDATE(), INTERVAL 570 MINUTE), '正常采集'),
(1, 'B20240115001', '检测中', '检验科', '李检验师', DATE_ADD(CURDATE(), INTERVAL 720 MINUTE), '送检'),
(1, 'B20240115001', '检测合格', '检验科', '李检验师', DATE_ADD(CURDATE(), INTERVAL 900 MINUTE), '所有项目合格'),
(1, 'B20240115001', '已入库', '血库', '张库管', DATE_ADD(CURDATE(), INTERVAL 960 MINUTE), '入库冷藏');

-- 插入示例用血申请
INSERT INTO blood_requests (request_no, hospital_id, hospital_name, patient_name, patient_gender, patient_age, patient_blood_type, rh_factor, component_type, request_volume, request_units, urgency, clinical_diagnosis, transfusion_reason, requester, request_date, status) VALUES
('REQ001', 1, '市第一人民医院', '患者甲', '男', 45, 'A', '阳性', '全血', 800, 2, '常规', '消化道出血', '贫血需要输血', '王医生', CURDATE(), '待审核'),
('REQ002', 2, '市中心医院', '患者乙', '女', 30, 'O', '阳性', '全血', 400, 1, '紧急', '外伤失血', '手术中失血', '李医生', CURDATE(), '已完成');
