import express from "express";
import Redis from "ioredis";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.post('/leaderboard/:id/view', async(req, res) => {
    const { id } = req.params;
    const views = await redis.incr(`user:${id}:score`);
    res.json({ message: 'View incremented by 1', userId: id, totalViews: views});
});

app.post('/leaderboard/score', async(req, res) => {
    const { id, score } = req.body;
    const newScore = await redis.zincrby('leaderboard', score, `user:${id}:score`);
    res.json({ message: 'Score updated', userId: id, totalScore: newScore });
});

app.get('/leaderboard', async(req, res) => {
    const leaderboard = await redis.zrevrange('leaderboard', 0, 9, 'WITHSCORES');
    res.json(leaderboard);
});

app.get('/leaderboard/:id/rank', async(req, res) => {
    const { id } = req.params;
    const rank = await redis.zrevrank('leaderboard', `user:${id}:score`);
    if(rank !== null) {
        res.json({ userId: id, rank: rank + 1 });
    } else {
        res.json({ message: 'User not found in leaderboard' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});