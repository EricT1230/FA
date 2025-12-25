-- Seed data for Freelancer Aggregator
-- Version: 1.0.0
-- Description: Initial test data for development

-- Insert demo users
INSERT INTO users (id, email, name, notification_preferences) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'alice@team.com', 'Alice Chen', '{"email": true, "teamDecisions": true, "dailyDigest": true, "realTimeAlerts": true}'),
('550e8400-e29b-41d4-a716-446655440002', 'bob@team.com', 'Bob Wang', '{"email": true, "teamDecisions": true, "dailyDigest": false, "realTimeAlerts": true}'),
('550e8400-e29b-41d4-a716-446655440003', 'charlie@team.com', 'Charlie Liu', '{"email": false, "teamDecisions": true, "dailyDigest": true, "realTimeAlerts": false}'),
('550e8400-e29b-41d4-a716-446655440004', 'diana@team.com', 'Diana Zhang', '{"email": true, "teamDecisions": true, "dailyDigest": true, "realTimeAlerts": true}');

-- Insert demo teams
INSERT INTO teams (id, name, description, settings) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Frontend Specialists', 'Specialized team for React/Next.js projects', '{"minScore": 75, "maxApplicants": 15, "preferRemote": true, "autoNotify": true}'),
('550e8400-e29b-41d4-a716-446655440011', 'Full-Stack Team', 'End-to-end development team', '{"minScore": 70, "maxApplicants": 20, "preferRemote": false, "autoNotify": true}'),
('550e8400-e29b-41d4-a716-446655440012', 'Data Analytics', 'Data science and analytics team', '{"minScore": 80, "maxApplicants": 10, "preferRemote": true, "autoNotify": false}');

-- Insert team members
INSERT INTO team_members (team_id, user_id, role, permissions) VALUES
-- Frontend Specialists team
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'OWNER', '{"canMakeDecisions": true, "canSubmitSignals": true, "canViewAll": true}'),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'TECHNICAL_REVIEWER', '{"canMakeDecisions": false, "canSubmitSignals": true, "canViewAll": true}'),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 'BUSINESS_REVIEWER', '{"canMakeDecisions": false, "canSubmitSignals": true, "canViewAll": false}'),

-- Full-Stack Team
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 'OWNER', '{"canMakeDecisions": true, "canSubmitSignals": true, "canViewAll": true}'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'DECISION_OWNER', '{"canMakeDecisions": true, "canSubmitSignals": true, "canViewAll": true}'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', 'TECHNICAL_REVIEWER', '{"canMakeDecisions": false, "canSubmitSignals": true, "canViewAll": true}'),

-- Data Analytics team
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 'OWNER', '{"canMakeDecisions": true, "canSubmitSignals": true, "canViewAll": true}'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440004', 'TECHNICAL_REVIEWER', '{"canMakeDecisions": false, "canSubmitSignals": true, "canViewAll": true}');

-- Insert sample raw jobs (simulating ingestion results)
INSERT INTO raw_jobs (id, source, external_id, title, url, posted_at, raw_data) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'yourator', 'yourator-20231224-001', '網站前端工程師（接案/約聘）', 'https://www.yourator.co/jobs/example-1', '2023-12-23T11:30:00Z', 
 '{"category": "Web/Frontend", "skills": ["React", "Next.js", "UI", "Figma"], "remote": false, "company": "Example Company", "description": "Frontend development with React and Next.js"}'),

('550e8400-e29b-41d4-a716-446655440021', 'wwr', 'wwr-20231224-001', 'Frontend Engineer – Next.js + React (Remote)', 'https://weworkremotely.com/example-1', '2023-12-23T02:10:00Z',
 '{"category": "Web/Frontend", "skills": ["Next.js", "React", "TypeScript", "Tailwind", "API"], "remote": true, "company": "Remote First Co", "salary": "$60,000 - $80,000", "applicants": "10-15"}'),

('550e8400-e29b-41d4-a716-446655440022', 'yourator', 'yourator-20231224-002', '全端工程師（Next.js + Node.js）', 'https://www.yourator.co/jobs/example-2', '2023-12-20T08:40:00Z',
 '{"category": "Web/Fullstack", "skills": ["Next.js", "Node.js", "PostgreSQL", "Auth"], "remote": true, "company": "Tech Startup", "description": "Full-stack development with modern stack"}'),

('550e8400-e29b-41d4-a716-446655440023', 'wwr', 'wwr-20231224-002', 'Data / Scraping Contractor – ETL + APIs', 'https://weworkremotely.com/example-2', '2023-12-21T19:05:00Z',
 '{"category": "Data/Scraping", "skills": ["Python", "Scraping", "ETL", "PostgreSQL"], "remote": true, "company": "Data Analytics Corp", "salary": "$70,000 - $90,000", "applicants": "25-50"}');

-- Insert processed jobs (after scoring)
INSERT INTO jobs (id, raw_job_id, source_key, title, url, posted_at, category, skills, remote, applicants_min, applicants_max, ehr_twd, score, breakdown, reasons_top, reasons_positive, reasons_negative, fx_as_of) VALUES

('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', 'yourator', '網站前端工程師（接案/約聘）', 'https://www.yourator.co/jobs/example-1', '2023-12-23T11:30:00Z', 'Web/Frontend', 
 '["React", "Next.js", "UI", "Figma"]', false, null, null, 1200.00, 71,
 '{"P": 0.63, "Fit": 0.78, "Q": 0.70, "R": 0.18, "Comp": 0.40}',
 '["技能吻合：React/Next.js", "需求描述清楚", "競爭指標缺值（採保守）"]',
 '["技能匹配度高（React/Next.js）", "工作內容描述具體（頁面/元件）"]',
 '["遠端限制（偏現場/混合）", "投稿人數未提供（使用預設競爭懲罰）"]',
 '2023-12-23T00:00:00Z'),

('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', 'wwr', 'Frontend Engineer – Next.js + React (Remote)', 'https://weworkremotely.com/example-1', '2023-12-23T02:10:00Z', 'Web/Frontend',
 '["Next.js", "React", "TypeScript", "Tailwind", "API"]', true, 10, 15, 1800.00, 82,
 '{"P": 0.82, "Fit": 0.76, "Q": 0.62, "R": 0.20, "Comp": 0.38}',
 '["有效時薪高於同類別 p75", "技能命中：React/Next.js", "競爭低：已投稿約 13"]',
 '["有效時薪顯著高於同類別 p75", "技能命中率高（前端框架與 TS）", "案子描述含交付物與技術細節"]',
 '["競爭中等（投稿區間 10–15）", "需求未明確列出驗收方式"]',
 '2023-12-23T00:00:00Z'),

('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440022', 'yourator', '全端工程師（Next.js + Node.js）', 'https://www.yourator.co/jobs/example-2', '2023-12-20T08:40:00Z', 'Web/Fullstack',
 '["Next.js", "Node.js", "PostgreSQL", "Auth"]', true, null, null, 1450.00, 77,
 '{"P": 0.72, "Fit": 0.80, "Q": 0.58, "R": 0.22, "Comp": 0.40}',
 '["技能命中：全端堆疊", "遠端", "競爭指標缺值（採保守）"]',
 '["技能命中率高（Next.js/Node/DB）", "可遠端"]',
 '["需求未標示固定價/時薪（需再確認）", "投稿人數未提供（使用預設競爭懲罰）"]',
 '2023-12-23T00:00:00Z'),

('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440023', 'wwr', 'Data / Scraping Contractor – ETL + APIs', 'https://weworkremotely.com/example-2', '2023-12-21T19:05:00Z', 'Data/Scraping',
 '["Python", "Scraping", "ETL", "PostgreSQL"]', true, 25, 50, 2200.00, 69,
 '{"P": 0.90, "Fit": 0.52, "Q": 0.64, "R": 0.28, "Comp": 0.88}',
 '["有效時薪高", "需求含技術細節", "競爭高（25–50）"]',
 '["有效時薪高於同類別 p75", "需求提及 ETL 與 DB"]',
 '["競爭高（投稿區間 25–50）", "技能命中率中等（需 Python/ETL）"]',
 '2023-12-23T00:00:00Z');

-- Insert risk assessments
INSERT INTO job_risk_assessments (job_id, gate_status, risk_score, factors, recommendations) VALUES

('550e8400-e29b-41d4-a716-446655440030', 'SOFT_WARNING', 45, 
 '[{"category": "PAYMENT_RISK", "score": 15, "severity": "MEDIUM", "indicators": ["Low hourly rate (<1000 TWD/hr)"], "description": "Risk of payment delays or disputes"}, {"category": "COMMUNICATION_RISK", "score": 10, "severity": "LOW", "indicators": [], "description": "Risk of poor client communication"}, {"category": "TECHNICAL_RISK", "score": 5, "severity": "LOW", "indicators": [], "description": "Risk of technical complexity exceeding expectations"}, {"category": "TIMELINE_RISK", "score": 10, "severity": "LOW", "indicators": [], "description": "Risk of unrealistic or tight deadlines"}, {"category": "COMPETITION_RISK", "score": 5, "severity": "LOW", "indicators": [], "description": "Risk due to high competition levels"}]',
 '["⚠️ PROCEED WITH CAUTION: Multiple risk factors detected", "Consider additional due diligence before applying"]'),

('550e8400-e29b-41d4-a716-446655440031', 'PASS', 25,
 '[{"category": "PAYMENT_RISK", "score": 0, "severity": "LOW", "indicators": [], "description": "Risk of payment delays or disputes"}, {"category": "COMMUNICATION_RISK", "score": 10, "severity": "LOW", "indicators": [], "description": "Risk of poor client communication"}, {"category": "TECHNICAL_RISK", "score": 5, "severity": "LOW", "indicators": [], "description": "Risk of technical complexity exceeding expectations"}, {"category": "TIMELINE_RISK", "score": 5, "severity": "LOW", "indicators": [], "description": "Risk of unrealistic or tight deadlines"}, {"category": "COMPETITION_RISK", "score": 5, "severity": "LOW", "indicators": [], "description": "Risk due to high competition levels"}]',
 '["✅ LOW RISK: Suitable for application"]'),

('550e8400-e29b-41d4-a716-446655440032', 'PASS', 30,
 '[{"category": "PAYMENT_RISK", "score": 10, "severity": "LOW", "indicators": [], "description": "Risk of payment delays or disputes"}, {"category": "COMMUNICATION_RISK", "score": 5, "severity": "LOW", "indicators": [], "description": "Risk of poor client communication"}, {"category": "TECHNICAL_RISK", "score": 5, "severity": "LOW", "indicators": [], "description": "Risk of technical complexity exceeding expectations"}, {"category": "TIMELINE_RISK", "score": 5, "severity": "LOW", "indicators": [], "description": "Risk of unrealistic or tight deadlines"}, {"category": "COMPETITION_RISK", "score": 5, "severity": "LOW", "indicators": [], "description": "Risk due to high competition levels"}]',
 '["✅ LOW RISK: Suitable for application"]'),

('550e8400-e29b-41d4-a716-446655440033', 'SOFT_WARNING', 55,
 '[{"category": "PAYMENT_RISK", "score": 0, "severity": "LOW", "indicators": [], "description": "Risk of payment delays or disputes"}, {"category": "COMMUNICATION_RISK", "score": 5, "severity": "LOW", "indicators": [], "description": "Risk of poor client communication"}, {"category": "TECHNICAL_RISK", "score": 10, "severity": "LOW", "indicators": [], "description": "Risk of technical complexity exceeding expectations"}, {"category": "TIMELINE_RISK", "score": 10, "severity": "LOW", "indicators": [], "description": "Risk of unrealistic or tight deadlines"}, {"category": "COMPETITION_RISK", "score": 30, "severity": "HIGH", "indicators": ["High competition (37 applicants average)"], "description": "Risk due to high competition levels"}]',
 '["⚠️ PROCEED WITH CAUTION: Multiple risk factors detected", "Consider additional due diligence before applying", "🎯 Differentiate your proposal clearly"]');

-- Insert sample participant signals
INSERT INTO participant_signals (job_id, team_id, user_id, role, signal, reasoning) VALUES
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'OWNER', 'RECOMMEND', 
 '{"category": "STRATEGIC", "details": "Perfect fit for our frontend specialization", "confidence": 0.9}'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'TECHNICAL_REVIEWER', 'RECOMMEND',
 '{"category": "TECHNICAL", "details": "Tech stack aligns with our expertise", "confidence": 0.8}'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 'BUSINESS_REVIEWER', 'RECOMMEND',
 '{"category": "BUDGET", "details": "Excellent hourly rate within budget", "confidence": 0.85}');

-- Insert sample decision record
INSERT INTO decision_records (id, job_id, team_id, job_snapshot, risk_assessment, participant_signals, decided_by, decision_outcome, reasoning, confidence, conditions) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440010',
 '{"id": "550e8400-e29b-41d4-a716-446655440031", "title": "Frontend Engineer – Next.js + React (Remote)", "score": 82, "ehr_twd": 1800.00}',
 '{"gateStatus": "PASS", "riskScore": 25}',
 '[{"userId": "550e8400-e29b-41d4-a716-446655440001", "role": "OWNER", "signal": "RECOMMEND"}, {"userId": "550e8400-e29b-41d4-a716-446655440002", "role": "TECHNICAL_REVIEWER", "signal": "RECOMMEND"}, {"userId": "550e8400-e29b-41d4-a716-446655440003", "role": "BUSINESS_REVIEWER", "signal": "RECOMMEND"}]',
 '550e8400-e29b-41d4-a716-446655440001', 'PROCEED',
 'Unanimous team recommendation. High score, low risk, perfect tech stack match. Excellent opportunity for the team.',
 0.95,
 '["Request milestone payments", "Establish weekly progress reports", "Clarify technical deliverables upfront"]');

-- Insert team job decision
INSERT INTO team_job_decisions (team_id, job_id, decision_id, outcome) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440040', 'PROCEED');

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message, data) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'TEAM_DECISION', 'Decision Made: Frontend Engineer – Next.js + React (Remote)', 'Team decision: PROCEED (Score: 82)', 
 '{"teamId": "550e8400-e29b-41d4-a716-446655440010", "jobId": "550e8400-e29b-41d4-a716-446655440031", "outcome": "PROCEED"}'),
('550e8400-e29b-41d4-a716-446655440003', 'TEAM_DECISION', 'Decision Made: Frontend Engineer – Next.js + React (Remote)', 'Team decision: PROCEED (Score: 82)',
 '{"teamId": "550e8400-e29b-41d4-a716-446655440010", "jobId": "550e8400-e29b-41d4-a716-446655440031", "outcome": "PROCEED"}'),
('550e8400-e29b-41d4-a716-446655440001', 'REAL_TIME_ALERT', '🚨 High-Score Job Alert: Frontend Engineer – Next.js + React (Remote)', 'Score: 82 | Risk: PASS | High score: 82',
 '{"jobId": "550e8400-e29b-41d4-a716-446655440031", "score": 82, "gateStatus": "PASS"}');