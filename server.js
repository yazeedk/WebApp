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
const dbName = "twitter_db";
const collectionName = "tweets";

mongoose.connect(uri)
    .then(() =>( console.log('MongoDB Connected')))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); 
    });

const tweetSchema = new mongoose.Schema(
    {
        "_id": { type: String, required: true },
        "coordinates": { type: String, default: 'Point' },
        "timestamp": { type: Date, required: true },
        "cleaned_text": { type: String },
        "hashtags": [{ type: String }],
        "sentiment_score": { type: Number }
    }
);
const Tweet = mongoose.model('tweets', tweetSchema);

app.get('/api/trend/:aggregation', async (req, res) => {
    const { aggregation } = req.query;
    try {
        const groupByField = aggregation === 'Daily' ? { $dayOfMonth: '$timestamp' } : { $hour: '$timestamp' };
        const tweets = await Tweet.aggregate([
            { $project: { time_unit: groupByField, _id: 0 } },
            { $group: { _id: '$time_unit', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
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
        const tweets = await Tweet.find({ cleaned_text: new RegExp(keyword, 'i') }).select('coordinates');
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
            { $match: { cleaned_text: new RegExp(keyword, 'i') } },
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
