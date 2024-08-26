import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../backend/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (req.method === 'GET') {
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    db.all('SELECT * FROM WorkSchedule WHERE user_id = ?', [userId], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (rows.length === 0) {
        return res.status(404).json({ error: 'No schedule found for this user' });
      }
      return res.status(200).json({ workSchedule: rows });
    });

  } else if (req.method === 'POST') {
    const { day, location, note } = req.body;

    if (!userId || !day || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    db.run(
      'INSERT INTO WorkSchedule (user_id, day, location, note) VALUES (?, ?, ?, ?)',
      [userId, day, location, note],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        return res.status(201).json({ id: this.lastID, userId, day, location, note });
      }
    );

  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
