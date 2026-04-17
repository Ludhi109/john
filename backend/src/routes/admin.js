const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * Maps SQL snake_case fields to Frontend camelCase
 */
const mapExam = (exam) => ({
  _id: exam.id,
  title: exam.title,
  description: exam.description,
  duration: exam.duration,
  attemptLimit: exam.attempt_limit,
  randomize: !!exam.randomize,
  enableSecurity: !!exam.enable_security,
  createdAt: exam.created_at
});

// @route   POST api/admin/seed
router.post('/seed', async (req, res) => {
  try {
    await db.execute('PRAGMA foreign_keys = OFF');
    await db.execute('DELETE FROM attempts');
    await db.execute('DELETE FROM questions');
    await db.execute('DELETE FROM exams');
    await db.execute('DELETE FROM users');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminId = uuidv4();
    await db.execute({
      sql: 'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      args: [adminId, 'Admin User', 'admin@example.com', hashedPassword, 'admin']
    });

    const studentId = uuidv4();
    await db.execute({
      sql: 'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      args: [studentId, 'Student User', 'student@example.com', hashedPassword, 'student']
    });

    const examId = uuidv4();
    await db.execute({
      sql: 'INSERT INTO exams (id, title, description, duration, attempt_limit, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      args: [examId, 'Full-Stack Mastery (SQL Edition)', 'Evaluating proficiency in modern stack and SQL.', 30, 2, adminId]
    });

    await db.execute({
      sql: 'INSERT INTO questions (id, exam_id, type, content, options, answer, points) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [uuidv4(), examId, 'MCQ', 'Which React hook is used for side effects?', JSON.stringify(['useState', 'useEffect', 'useContext', 'useReducer']), 'useEffect', 10]
    });

    await db.execute({
      sql: 'INSERT INTO questions (id, exam_id, type, content, answer, keywords, points) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [uuidv4(), examId, 'short-answer', 'What does JWT stand for?', 'JSON Web Token', JSON.stringify(['JSON', 'Web', 'Token']), 20]
    });

    await db.execute({
      sql: 'INSERT INTO questions (id, exam_id, type, content, answer, test_cases, points) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [uuidv4(), examId, 'coding', 'Write a function "solution(a, b)" that returns their sum.', 'function solution(a, b) { return a + b; }', JSON.stringify([{ input: '2, 3', output: '5' }]), 60]
    });

    await db.execute('PRAGMA foreign_keys = ON');
    res.json({ message: 'Database seeded with SQL data successfully' });
  } catch (err) {
    console.error(err);
    await db.execute('PRAGMA foreign_keys = ON');
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/exams
router.post('/exams', async (req, res) => {
  try {
    const { title, description, duration, attemptLimit, randomize, enableSecurity } = req.body;
    const id = uuidv4();
    await db.execute({
      sql: 'INSERT INTO exams (id, title, description, duration, attempt_limit, randomize, enable_security, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, title, description, duration, attemptLimit, randomize, enableSecurity, req.user.id]
    });
    res.json({ _id: id, title, description, duration, attemptLimit, randomize, enableSecurity });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/exams
router.get('/exams', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM exams ORDER BY created_at DESC');
    res.json(result.rows.map(mapExam));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/exams/:id
router.put('/exams/:id', async (req, res) => {
  try {
    const { title, description, duration, attemptLimit, randomize, enableSecurity } = req.body;
    await db.execute({
      sql: 'UPDATE exams SET title = ?, description = ?, duration = ?, attempt_limit = ?, randomize = ?, enable_security = ? WHERE id = ?',
      args: [title, description, duration, attemptLimit, randomize, enableSecurity, req.params.id]
    });
    res.json({ message: 'Exam updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/exams/:id
router.delete('/exams/:id', async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM exams WHERE id = ?', args: [req.params.id] });
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/questions/:examId
router.get('/questions/:examId', async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM questions WHERE exam_id = ?', args: [req.params.examId] });
    const questions = result.rows.map(q => ({
      ...q,
      _id: q.id,
      options: q.options ? JSON.parse(q.options) : [],
      testCases: q.test_cases ? JSON.parse(q.test_cases) : [],
      keywords: q.keywords ? JSON.parse(q.keywords) : []
    }));
    res.json(questions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/questions
router.post('/questions', async (req, res) => {
  try {
    const { examId, type, content, options, answer, points, testCases, keywords } = req.body;
    const id = uuidv4();
    await db.execute({
      sql: 'INSERT INTO questions (id, exam_id, type, content, options, answer, points, test_cases, keywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, examId, type, content, JSON.stringify(options), answer, points, JSON.stringify(testCases), JSON.stringify(keywords)]
    });
    res.json({ _id: id, content, type });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/questions/:id
router.put('/questions/:id', async (req, res) => {
  try {
    const { type, content, options, answer, points, testCases, keywords } = req.body;
    await db.execute({
      sql: 'UPDATE questions SET type = ?, content = ?, options = ?, answer = ?, points = ?, test_cases = ?, keywords = ? WHERE id = ?',
      args: [type, content, JSON.stringify(options), answer, points, JSON.stringify(testCases), JSON.stringify(keywords), req.params.id]
    });
    res.json({ message: 'Question updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/questions/:id
router.delete('/questions/:id', async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM questions WHERE id = ?', args: [req.params.id] });
    res.json({ message: 'Question deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/analytics/:examId
router.get('/analytics/:examId', async (req, res) => {
  try {
    const { examId } = req.params;

    // 1. Get total points possible
    const pointsRes = await db.execute({
      sql: 'SELECT SUM(points) as maxPoints FROM questions WHERE exam_id = ?',
      args: [examId]
    });
    const maxPoints = pointsRes.rows[0].maxPoints || 0;

    // 2. Get all attempts for this exam
    const attemptsRes = await db.execute({
      sql: 'SELECT score FROM attempts WHERE exam_id = ? AND status = ?',
      args: [examId, 'completed']
    });
    const attempts = attemptsRes.rows;

    if (attempts.length === 0) {
      return res.json({
        totalAttempts: 0,
        avgScore: 0,
        maxPoints,
        passRate: 0,
        scoreDistribution: { '0-25': 0, '25-50': 0, '50-75': 0, '75-100': 0 }
      });
    }

    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = totalScore / totalAttempts;

    // 3. Calculate pass rate (>= 50% of maxPoints)
    const passingAttempts = attempts.filter(a => a.score >= (maxPoints * 0.5)).length;
    const passRate = (passingAttempts / totalAttempts) * 100;

    // 4. Score Distribution
    const distribution = { '0-25': 0, '25-50': 0, '50-75': 0, '75-100': 0 };
    attempts.forEach(a => {
      const percentage = maxPoints > 0 ? (a.score / maxPoints) * 100 : 0;
      if (percentage < 25) distribution['0-25']++;
      else if (percentage < 50) distribution['25-50']++;
      else if (percentage < 75) distribution['50-75']++;
      else distribution['75-100']++;
    });

    res.json({
      totalAttempts,
      avgScore,
      maxPoints,
      passRate,
      scoreDistribution: distribution
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// @route   GET api/admin/results
router.get('/results', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT a.*, u.name as userName, u.email as userEmail, e.title as examTitle
      FROM attempts a
      JOIN users u ON a.user_id = u.id
      JOIN exams e ON a.exam_id = e.id
      ORDER BY a.start_time DESC
    `);
    
    const formatted = result.rows.map(r => ({
      _id: r.id,
      score: r.score,
      status: r.status,
      violationsCount: r.violations_count,
      user: { name: r.userName, email: r.userEmail },
      exam: { title: r.examTitle },
      createdAt: r.start_time
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/results/:id
router.get('/results/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT a.*, u.name as userName, u.email as userEmail, e.title as examTitle, e.description as examDescription
        FROM attempts a
        JOIN users u ON a.user_id = u.id
        JOIN exams e ON a.exam_id = e.id
        WHERE a.id = ?
      `,
      args: [req.params.id]
    });

    if (result.rows.length === 0) return res.status(404).json({ message: 'Result not found' });

    const r = result.rows[0];
    
    // Fetch questions to attach to answers for review
    const qRes = await db.execute({
      sql: 'SELECT id, type, content, points, answer FROM questions WHERE exam_id = ?',
      args: [r.exam_id]
    });
    const questions = qRes.rows;

    const answers = JSON.parse(r.answers || '[]');
    const answersWithDetails = answers.map(ans => {
      const q = questions.find(item => item.id === ans.questionId);
      return {
        ...ans,
        questionId: q || { content: 'Question Deleted', points: 0, type: 'unknown' }
      };
    });

    res.json({
      _id: r.id,
      score: r.score,
      status: r.status,
      violationsCount: r.violations_count,
      violationsLog: JSON.parse(r.violations_log || '[]'),
      user: { name: r.userName, email: r.userEmail },
      exam: { title: r.examTitle, description: r.examDescription },
      answers: answersWithDetails,
      createdAt: r.start_time
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH api/admin/results/:id/grade
router.patch('/results/:id/grade', async (req, res) => {
  try {
    const { score } = req.body;
    await db.execute({
      sql: 'UPDATE attempts SET score = ?, is_verified = ? WHERE id = ?',
      args: [score, 1, req.params.id]
    });
    res.json({ message: 'Score updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
