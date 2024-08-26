import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../backend/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const {user_id} = req.query;


    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    db.get('SELECT * FROM Users WHERE id = ?', [user_id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(200).json(row);
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
};

