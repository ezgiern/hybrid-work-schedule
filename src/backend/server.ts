import express, { Request, Response } from 'express';
import next from 'next';
import session from 'express-session';
import db from './db';
import sqlite3 from 'sqlite3';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  weekly_remote_days: number;
}

declare module 'express-session' {
  interface SessionData {
    user: User; // The declaration should be consistent everywhere
  }
}


app.prepare().then(() => {
  const server = express();

  // Middleware'leri ekleyelim
  server.use(express.json());

  // express-session middleware'i
  server.use(
    session({
      secret: 'your_secret_key', // Güçlü bir gizli anahtar seçin
      resave: false,
      saveUninitialized: true,
      cookie: { secure: !dev }, // HTTPS üzerinde çalışıyorsanız secure: true yapın
    })
  );

  // Ana sayfa rotası
  server.get('/', (req: Request, res: Response) => {
    return app.render(req, res, '/index');
  });

  // Kullanıcı ekleme (Employee ve User aynı kişi)
  server.post('/users', (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    db.run(
      'INSERT INTO Users (name, email, password, weekly_remote_days) VALUES (?, ?, ?, ?)',
      [name, email, password, 0],
      function (this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name, email });
      }
    );
  });

  // Kullanıcıları listeleme
  server.get('/users', (req: Request, res: Response) => {
    db.all('SELECT * FROM Users', [], (err: Error | null, rows: any[]) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ users: rows });
    });
  });

  // Çalışma gününü ekleme/güncelleme
  server.post('/schedule', (req: Request, res: Response) => {
    const { user_id, day, location, note } = req.body;

    // Pazartesi remote yasak
    if (day === 'Monday' && location === 'Home') {
      return res.status(400).json({ error: 'Remote work is not allowed on Mondays.' });
    }

    db.get('SELECT weekly_remote_days FROM Users WHERE id = ?', [user_id], (err: Error | null, row: any) => {
      if (err || !row) return res.status(500).json({ error: err ? err.message : 'User not found' });

      // Haftalık 2 gün remote sınırı
      if (location === 'Home' && row.weekly_remote_days >= 2) {
        return res.status(400).json({ error: 'Exceeded weekly remote days limit.' });
      }

      // Ofiste %40 kuralı kontrolü
      db.all('SELECT COUNT(*) AS remoteCount FROM WorkSchedule WHERE day = ? AND location = "Home"', [day], (err: Error | null, result: any[]) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const remoteCount = result[0].remoteCount;
        const totalUsers = 10; // Toplam kullanıcı sayısı (örnek)
        const officeCount = totalUsers - (remoteCount + 1); // Talep edilen remote izni hesaba katıyoruz

        // %40 kuralını kontrol et
        if (officeCount < Math.ceil(totalUsers * 0.4)) {
          return res.status(400).json({ error: 'At least 40% of users must be in the office.' });
        }

        // Eğer tüm kurallar geçerliyse, çalışma gününü ekle
        db.run('INSERT INTO WorkSchedule (user_id, day, location, note) VALUES (?, ?, ?, ?)', [user_id, day, location, note], function (this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Remote gün sayısını artır
          if (location === 'Home') {
            db.run('UPDATE Users SET weekly_remote_days = weekly_remote_days + 1 WHERE id = ?', [user_id]);
          }

          res.json({ id: this.lastID, user_id, day, location, note });
        });
      });
    });
  });

  // Belirli bir kullanıcının programını alma
  server.get('/schedule/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    db.all('SELECT * FROM WorkSchedule WHERE user_id = ?', [userId], (err: Error | null, rows: any[]) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ schedule: rows });
    });
  });

  // Giriş yapma
  server.post('/login', (req: Request, res: Response) => {
    const { email, password } = req.body;

    db.get<User>('SELECT * FROM Users WHERE email = ?', [email], (err: Error | null, user: User) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(400).json({ error: 'User not found' });

      if (user.password !== password) {
        return res.status(400).json({ error: 'Invalid password' });
      }

      // Başarılı giriş
      req.session.user = user; // Oturum bilgisi kaydediliyor
      res.json({ message: 'Login successful', user });
    });
  });

  // Next.js sayfa isteklerini handle etme
  server.get('*', (req: Request, res: Response) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  server.once('error', (err: Error) => {
    console.error('Server error:', err);
  });
});






