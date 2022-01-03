const express = require('express');
const bodyParser = require('body-parser');
import { MongoClient} from 'mongodb';
import path from 'path';

const app = express();

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '/build')))

app.get('/hello/:name', (req, res) => {
    console.log(`req.body = ${JSON.stringify(req.params)}`);
    res.send(`Hello ${req.params.name}!`);
})

app.post('/hello', (req, res) =>{
    console.log(`req.body = ${JSON.stringify(req.body)}`);
    res.send(`Hello ${req.body.name}!`);

})

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser: true});
        const db = client.db('my-blog');
       
        await operations(db);
        
        client.close();
    } catch (e) {
        res.status(500).json({message: 'Error connecting to db', e});
    }
}

app.get('/api/articles/:name', async (req, res) => {
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({name: articleName})
        res.status(200).json(articleInfo);
    }, res)    
})


app.post('/api/articles/:name/upvote', async (req, res) => {
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({name: articleName});
        const newUpvote = articleInfo.upvotes + 1;

        await db.collection('articles').updateOne(
            {name: articleInfo.name},
            {'$set': {upvotes: newUpvote}}
        );
        const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updatedArticleInfo);
    }, res)
})

app.post('/api/articles/:name/add-comment', (req, res) => {
    console.log(`req.body = ${JSON.stringify(req.body)}`)
    console.log(`req.params = ${JSON.stringify(req.params)}`)
    const {username, text} = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({name: articleName});

        await db.collection('articles').updateOne(
            {name: articleInfo.name},
            {'$set': {comments: articleInfo.comments.concat({username, text})}}
        );
        const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updatedArticleInfo);
    }, res)
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log('Listening on port 8000'));

const testArticlesInfo = [
    {
        "name": 'learn-react',
        upvotes: 0,
        comments: []
    },
    {
        "name": 'learn-node',
        upvotes: 0,
        comments: []
    },
    {
        "name": 'my-thoughts-on-resumes',
        upvotes: 0,
        comments: []
        
    }
]
