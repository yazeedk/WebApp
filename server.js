const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors());  // Enable CORS

// MongoDB connection string from MongoDB Atlas
const uri = "mongodb+srv://teamtp10:test123@cluster0.5jb5h.mongodb.net/twitter_db";
const dbName = "twitter_db";  // Database name
const collectionName = "tweets"; // Collection name

// MongoDB connection
mongoose.connect(uri)
    .then(() =>( console.log('MongoDB Connected')))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);  // Exit process if connection fails
    });


// Define Tweet Schema
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

// Create Tweet model
const Tweet = mongoose.model('tweets', tweetSchema);

// Endpoint to fetch trend data (tweets count per hour or day)
app.get('/api/trend/:aggregation', async (req, res) => {
    const { aggregation } = req.query;
    try {
        const groupByField = aggregation === 'Daily' ? { $dayOfMonth: '$timestamp' } : { $hour: '$timestamp' };
        const tweets = await Tweet.aggregate([
            { $project: { time_unit: groupByField, _id: 0 } },
            { $group: { _id: '$time_unit', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }, // Sort by time unit (hour or day)
        ]);
        res.json(tweets);
    } catch (err) {
        console.error('Error fetching trend data:', err);  // Log the error
        res.status(500).json({ error: 'Error fetching trend data' });
    }
});


// Endpoint to fetch tweet locations (geo-coordinates)
app.get('/api/locations/:keyword', async (req, res) => {
    const { keyword } = req.params;
    try {
        const tweets = await Tweet.find({ cleaned_text: new RegExp(keyword, 'i') }).select('coordinates');
        res.json(tweets);
    } catch (err) {
        console.error('Error fetching location data:', err);  // Log the error
        res.status(500).json({ error: 'Error fetching location data' });
    }
});

// Endpoint to fetch sentiment analysis
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
