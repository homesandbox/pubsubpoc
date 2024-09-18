const express = require('express');
const { WebPubSubServiceClient } = require('@azure/web-pubsub');
const cors = require('cors');
const { validateToken } = require('./middleware/validateToken');
const postgres = require('postgres');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;
const DB_URL = 'postgres://postgres:postgres@localhost:5432/pubsubpoc';

const connection = postgres(DB_URL);
const pubSubServiceClient = new WebPubSubServiceClient(process.env.WEB_PUBSUB_CONNECTION_STRING, 'chat');
const groupNames = ['messages', 'notifications'];

// TODO update rest
app.get('/api/teams/negotiate', validateToken, async (req, res) => {
    const userId = req.auth?.userId;  // Get from token

    // Generate the client access token
    const token = await pubSubServiceClient.getClientAccessToken({
        userId,
        roles: groupNames.map((group) => `webpubsub.joinLeaveGroup.${group.name}`)  // Allow the client to join/leave each group
    });

    res.json({ url: token.url });
});

// TODO this approach vs pubsubclient?
// TODO update rest
app.post('/api/teams/subscribe', validateToken, async (req, res) => {
    const userId = req.auth?.userId;  // Get from token

    try {
        for (const group of groupNames) {
            await pubSubServiceClient.group(group).addUser(userId);
        }
        res.json({});
    } catch (e) {
        console.error(`Can't subscribe the user ${userId}`, e);
        res.json({
            "error": e.message
        });
    }
});

app.post('/api/teams/:teamId/messages', validateToken, async (req, res) => {
    console.log("Got send message request, body ", req.body)
    const userId = req.auth?.userId;  // Get from token
	const teamId = req.params.teamId;

    const groupName = 'messages';
    const message = {
        message: req.body.payload,
        typeId: req.body.typeId,
		senderId: userId,
        groupName: groupName
    }; // check typeId of message to determine

	await connection.unsafe(`
		INSERT INTO "public"."message" (
			"team_id",
			"type_id",
			"sender_id",
			"payload"
		) VALUES (
			$1,
			$2,
			$3,
			$4
		);
	`, [
		teamId,
		1,
		userId,
		req.body.payload
	]);

	// take recievers from teamId
	const receivers = await connection.unsafe(`
		SELECT "user_id" as "id" FROM "public"."team_participants"
		WHERE "team_id" = $1
		AND "user_id" != $2;
	`, [teamId, userId]);

	// is it 1 msg, or N
    for (const receiver of receivers) {
		await pubSubServiceClient.sendToUser(receiver.id, message, {
			filter: `'${groupName}' in groups`,
			messageTtlSeconds: 10
		});
	}
    res.json({});
});

app.get('/api/teams/:teamId/messages', async (req, res) => {
    // const userId = req.auth?.userId;
	const teamId = req.params.teamId;
	// const groupName = 'messages';

	const lastMessages = await connection.unsafe(`
		SELECT * FROM "public"."message"
		WHERE "created_at" < NOW()
		AND "created_at" >= NOW() - INTERVAL '1 DAY'
		AND "team_id" = $1
		ORDER BY "created_at"
		LIMIT 10;
	`, [teamId]);

	res.json({messages: lastMessages});
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
