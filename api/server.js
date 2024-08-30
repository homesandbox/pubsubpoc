const express = require('express');
const { WebPubSubServiceClient } = require('@azure/web-pubsub');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;

const pubSubClient = new WebPubSubServiceClient(process.env.WEB_PUBSUB_CONNECTION_STRING, 'chat');

const groupNames = ['messages', 'notifications'];  // List of groups to join

app.get('/api/chats/negotiate', async (req, res) => {
    const userId = 'your-user-id';  // Get from token

    // Generate the client access token
    const token = await pubSubClient.getClientAccessToken({
        userId: userId,
        roles: groupNames.map(groupName => `webpubsub.joinLeaveGroup.${groupName}`)  // Allow the client to join/leave each group
    });

    res.json({ url: token.url });
});

app.post('/api/chats/subscribe', async (req, res) => {
    const userId = 'your-user-id';  // Get from token

    try {
        for (const groupName of groupNames) {
            await pubSubClient.group(groupName).addUser(userId);
        }
        res.json({});
    } catch (e) {
        console.error(`Can't subscribe the user ${userId}`, e);
        res.json({
            "error": e.message
        });
    }
});

app.post('/api/chats/1/messages', async (req, res) => {
    console.log("Got send message request, body ", req.body)
    const groupName = 'messages';
    const userId = 'your-user-id';  // Get from token
    const message = {
        message: req.body.payload,
        typeId: req.body.typeId,
        groupName: groupName
    }; // check typeId of message to determine

    // get all user ids using chat id and in a loop send messages
    // Send a JSON message
    // First store message in DB
    await pubSubClient.sendToUser(userId, message, {
        filter: `'${groupName}' in groups`,
        messageTtlSeconds: 50
    });
    res.json({});
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
