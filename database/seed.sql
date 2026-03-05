INSERT INTO users (name, email, password, role, profile_picture) VALUES
('admin', 'admin@company.com', 'hashed_password', 'admin',   NULL),
('manager', 'manager@company.com', 'hashed_password', 'manager', NULL),
('Ziad Yasser', 'ziadyasser4111@gmail.com', 'hashed_password', 'member',  NULL),
('Hank Alice', 'hankalice@gmail.com', 'hashed_password', 'member',  NULL);

INSERT INTO clients (name, contact_name, contact_email, contact_phone, industry, logo) VALUES
('company 1', 'contractor 1', 'company1@gmail.com', '01112223445', 'Software', NULL),
('company 2', 'contractor 2', 'company2@gmail.com', '01112223446', 'Food Industry', NULL),
('company 3', 'contractor 3', 'company3@gmail.com', '01112223447', 'Medicine', NULL);

INSERT INTO projects (client_id, owner_id, name, description, start_date, end_date, status, priority, type) VALUES
(1, 1, 'Software Project', NULL, '2025-01-01', '2025-06-01', 'active', 'high', 'external'),
(2, 2, 'Foods Project', NULL, '2025-02-01', '2025-08-01', 'planning', 'medium', 'external'),
(NULL, 1, 'Internal Project 1', NULL, '2025-01-15', NULL, 'active', 'high', 'internal'),
(3, 3, 'Medicine Project', NULL, '2024-12-01', '2025-03-01', 'completed', 'low', 'external'),
(NULL, 2, 'Internal Project 2', NULL, '2025-03-01', NULL,'on_hold', 'medium', 'internal');

INSERT INTO project_members (project_id, user_id, role) VALUES
(1, 1, 'manager'),
(1, 2, 'member'),
(2, 2, 'manager'),
(2, 3, 'member'),
(3, 1, 'manager'),
(4, 3, 'manager'),
(5, 2, 'manager'),
(5, 4, 'member');

INSERT INTO tags (name) VALUES
('bug'),
('feature'),
('urgent'),
('backend'),
('frontend');

INSERT INTO tasks (project_id, assigned_to, created_by, title, description, due_date, status, priority) VALUES
(1, 2, 1, 'Setup project repository',  'Initialize repo and CI/CD pipeline', '2025-02-01', 'done',        'high'),
(1, 3, 1, 'Design database schema',    'ERD and table definitions',          '2025-03-01', 'in_progress', 'high'),
(2, 2, 2, 'Build landing page',        'Frontend landing page for client',   '2025-04-01', 'todo',        'medium'),
(3, 1, 1, 'Setup internal servers',    'Configure dev and prod servers',     '2025-02-15', 'done',        'high'),
(4, 3, 3, 'Write test cases',          'Unit tests for core modules',        '2025-01-15', 'review',      'low'),
(5, 4, 2, 'Plan Q2 roadmap',           'Internal planning document',         '2025-04-01', 'todo',        'medium');

INSERT INTO task_tags (task_id, tag_id) VALUES
(1, 4),
(1, 2),
(2, 4),
(2, 5),
(3, 5),
(4, 4),
(5, 1),
(6, 2);