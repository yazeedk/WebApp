const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors());

const uri = "mongodb+srv://teamtp10:test123@cluster0.5jb5h.mongodb.net/twitter_db";

mongoose.connect(uri)
    .then(() => (console.log('MongoDB Connected')))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const tweetSchema = new mongoose.Schema(
    {
        "created_at": { type: String, required: true },
        "coordinates": [{ type: String }],
        "hashtags": [{ type: String }],
        "text": { type: String },
        "sentiment_score": { type: Number }
    }
);
const Tweet = mongoose.model('tweets', tweetSchema);

app.get('/api/trend/:aggregation&:trendKeyword', async (req, res) => {
    const { aggregation, trendKeyword } = req.params;

    try {
        // Define the groupByField based on the aggregation level
        const groupByField =
            aggregation === 'daily'
                ? { $dateToString: { format: '%Y-%m-%d', date: { $toDate: '$created_at' } } } // Group by day
                : { $dateToString: { format: '%Y-%m-%d %H:00', date: { $toDate: '$created_at' } } }; // Group by hour

        // Use the aggregation pipeline
        const tweets = await Tweet.aggregate([
            { $match: { text: new RegExp(trendKeyword, 'i') } }, // Filter by text keyword
            { $project: { time_unit: groupByField } }, // Project the time unit
            { $group: { _id: '$time_unit', count: { $sum: 1 } } }, // Group by time unit and count
            { $sort: { _id: 1 } } // Sort by time unit
        ]);

        res.json(tweets);
    } catch (err) {
        console.error('Error fetching trend data:', err);
        res.status(500).json({ error: 'Error fetching trend data' });
    }
});




app.get('/api/locations/:keyword', async (req, res) => {
    const { keyword } = req.params;
    try {
        const tweets = await Tweet.find({
            text: new RegExp(keyword, 'i'),
            coordinates: { $ne: null } // Matches documents where `coordinates` is not null
        }).select('coordinates text created_at');
        res.json(tweets);
    } catch (err) {
        console.error('Error fetching location data:', err);
        res.status(500).json({ error: 'Error fetching location data' });
    }
});

app.get('/api/sentiment/:keyword', async (req, res) => {
    const { keyword } = req.params;
    try {
        const sentimentData = await Tweet.aggregate([
            { $match: { text: new RegExp(keyword, 'i') } },
            { $group: { _id: '$sentiment_score', count: { $sum: 1 } } },
        ]);
        res.json(sentimentData);
    } catch (err) {
        console.error('Error fetching sentiment data:', err);  // Log the error
        res.status(500).json({ error: 'Error fetching sentiment data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
