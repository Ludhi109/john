const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { evaluateCoding } = require('../utils/judger');

router.use(authMiddleware);

const mapExam = (exam) => ({
  _id: exam.id,
  title: exam.title,
  description: exam.description,
  duration: exam.duration,
  attemptLimit: exam.attempt_limit,
  enableSecurity: !!exam.enable_security
});

// @route   GET api/student/exams
router.get('/exams', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM exams ORDER BY created_at DESC');
    res.json(result.rows.map(mapExam));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/student/exams/:id
router.get('/exams/:id', async (req, res) => {
  try {
    const examRes = await db.execute({ sql: 'SELECT * FROM exams WHERE id = ?', args: [req.params.id] });
    if (examRes.rows.length === 0) return res.status(404).json({ message: 'Exam not found' });
    const exam = mapExam(examRes.rows[0]);

    const prevRes = await db.execute({ sql: 'SELECT COUNT(*) as count FROM attempts WHERE user_id = ? AND exam_id = ?', args: [req.user.id, req.params.id] });
    if (prevRes.rows[0].count >= exam.attemptLimit) {
      return res.status(403).json({ message: 'Attempt limit reached' });
    }

    const qRes = await db.execute({ sql: 'SELECT id, type, content, options, points FROM questions WHERE exam_id = ?', args: [req.params.id] });
    let questions = qRes.rows.map(q => ({
      _id: q.id,
      type: q.type,
      content: q.content,
      options: q.options ? JSON.parse(q.options) : [],
      points: q.points
    }));
    
    res.json({ exam, questions });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/student/submit
router.post('/submit', async (req, res) => {
  try {
    const { examId, answers, violations } = req.body;
    
    const qRes = await db.execute({ sql: 'SELECT * FROM questions WHERE exam_id = ?', args: [examId] });
    const questions = qRes.rows.map(q => ({
      ...q,
      test_cases: q.test_cases ? JSON.parse(q.test_cases) : [],
      keywords: q.keywords ? JSON.parse(q.keywords) : []
    }));

    let totalScore = 0;
    const evaluationResults = [];

    for (const submitted of answers) {
      const q = questions.find(item => item.id === submitted.questionId);
      if (!q) continue;

      let qScore = 0;
      let qDetails = {};

      if (q.type === 'MCQ') {
        if (q.answer === submitted.answer) qScore = q.points;
      } else if (q.type === 'short-answer') {
        const submittedText = (submitted.answer || "").toLowerCase();
        const matchedKeywords = q.keywords.filter(kw => submittedText.includes(kw.toLowerCase()));
        if (q.answer.toLowerCase() === submittedText) {
          qScore = q.points;
        } else if (matchedKeywords.length > 0 && q.keywords.length > 0) {
          qScore = (matchedKeywords.length / q.keywords.length) * q.points;
        }
      } else if (q.type === 'coding') {
        const result = await evaluateCoding(submitted.answer, 63, q.test_cases);
        qScore = result.total > 0 ? (result.passed / result.total) * q.points : 0;
        qDetails = result.details;
      }

      totalScore += qScore;
      evaluationResults.push({ questionId: q.id, score: qScore, details: qDetails });
    }

    const attemptId = uuidv4();
    await db.execute({
      sql: `INSERT INTO attempts (id, user_id, exam_id, score, status, end_time, violations_count, violations_log, answers) 
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`,
      args: [
        attemptId, req.user.id, examId, totalScore, 'completed', 
        violations?.length || 0, JSON.stringify(violations || []), JSON.stringify(answers)
      ]
    });

    res.json({ attempt: { _id: attemptId, score: totalScore }, evaluationResults });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/student/my-attempts
router.get('/my-attempts', async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM attempts WHERE user_id = ? ORDER BY start_time DESC', args: [req.user.id] });
    res.json(result.rows.map(r => ({ ...r, _id: r.id, exam: r.exam_id, createdAt: r.start_time })));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/student/stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const statsRes = await db.execute({
      sql: 'SELECT SUM(score) as totalPoints, COUNT(*) as examsTaken FROM attempts WHERE user_id = ? AND status = ?',
      args: [userId, 'completed']
    });

    const rankRes = await db.execute(`
      SELECT user_id, SUM(score) as points 
      FROM attempts 
      WHERE status = 'completed' 
      GROUP BY user_id 
      ORDER BY points DESC
    `);
    
    const rank = rankRes.rows.findIndex(r => r.user_id === userId) + 1;

    res.json({
      totalPoints: statsRes.rows[0].totalPoints || 0,
      examsTaken: statsRes.rows[0].examsTaken || 0,
      rank: rank || 0
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/student/attempts/:id
router.get('/attempts/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT a.*, e.title as examTitle, e.duration as examDuration, e.description as examDescription
        FROM attempts a
        JOIN exams e ON a.exam_id = e.id
        WHERE a.id = ? AND a.user_id = ?
      `,
      args: [req.params.id, req.user.id]
    });

    if (result.rows.length === 0) return res.status(404).json({ message: 'Attempt not found' });

    const r = result.rows[0];
    res.json({
      _id: r.id,
      score: r.score,
      violationsCount: r.violations_count,
      isVerified: !!r.is_verified,
      createdAt: r.start_time,
      exam: {
        _id: r.exam_id,
        title: r.examTitle,
        description: r.examDescription,
        duration: r.examDuration
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/student/leaderboard/:examId
router.get('/leaderboard/:examId', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT a.id, u.name, a.score, a.end_time
        FROM attempts a
        JOIN users u ON a.user_id = u.id
        WHERE a.exam_id = ? AND a.status = 'completed'
        ORDER BY a.score DESC, a.end_time ASC
        LIMIT 10
      `,
      args: [req.params.examId]
    });
    
    res.json(result.rows.map(r => ({
      _id: r.id,
      user: { name: r.name },
      score: r.score,
      endTime: r.end_time
    })));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
