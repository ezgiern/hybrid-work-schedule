import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'src/backend/database.sqlite');
const db = new sqlite3.Database(dbPath);


db.serialize(() => {
  // Kullanıcıları ekleyin
  const users = [
    { name: 'User 1', email: 'user1@example.com', password: '123456' },
    { name: 'User 2', email: 'user2@example.com', password: '123456' },
    { name: 'User 3', email: 'user3@example.com', password: '123456' },
    { name: 'User 4', email: 'user4@example.com', password: '123456' },
    { name: 'User 5', email: 'user5@example.com', password: '123456' },
    { name: 'User 6', email: 'user6@example.com', password: '123456' },
    { name: 'User 7', email: 'user7@example.com', password: '123456' },
    { name: 'User 8', email: 'user8@example.com', password: '123456' },
    { name: 'User 9', email: 'user9@example.com', password: '123456' },
    { name: 'User 10', email: 'user10@example.com', password: '123456' }
  ];

  users.forEach(user => {
    db.run(
      "INSERT INTO Users (name, email, password) VALUES (?, ?, ?)",
      [user.name, user.email, user.password],
      function(err: Error | null) {
        if (err) {
          console.log(`Error adding user ${user.name}:`, err.message);
        } else {
          console.log(`User ${user.name} added successfully.`);
        }
      }
    );
  });
});

db.close();




