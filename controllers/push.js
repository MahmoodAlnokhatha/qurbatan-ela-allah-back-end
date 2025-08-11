const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verify-token');
const PushSub = require('../models/pushSub');

router.get('/public-key', (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', verifyToken, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys) return res.status(400).json({ err: 'Bad subscription' });

    await PushSub.findOneAndUpdate(
      { user: req.user._id, endpoint },
      { user: req.user._id, endpoint, keys },
      { upsert: true, new: true }
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ err: e.message });
  }
});

module.exports = router;