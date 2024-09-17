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

// TODO update rest
app.get('/api/chats/negotiate', validateToken, async (req, res) => {
    const userEmail = req.auth?.userEmail;  // Get from token

	const groupNames = await connection.unsafe(`
		SELECT "name" FROM "public"."chat";	
	`);

    // Generate the client access token
    const token = await pubSubServiceClient.getClientAccessToken({
        userId: userEmail,
        roles: groupNames.map((group) => `webpubsub.joinLeaveGroup.${group.name}`)  // Allow the client to join/leave each group
    });

    res.json({ url: token.url });
});

// TODO this approach vs pubsubclient?
// TODO update rest
app.post('/api/chats/subscribe', validateToken, async (req, res) => {
    const userEmail = req.auth?.userEmail;  // Get from token
	const groupNames = await connection.unsafe(`
		SELECT "name", "id" FROM "public"."chat";	
	`);
	const user = await connection.unsafe(`
		SELECT "id" FROM "public"."user"
		WHERE "email" = $1
	`, [userEmail]);
	
	const userId = user[0].id;

    try {
        for (const group of groupNames) {
			await connection.unsafe(`
				INSERT INTO "public"."chat_partisipants" (
					"chat_id",
					"user_id"
				) VALUES
				($1, $2),
				($3, $4)
				ON CONFLICT ON CONSTRAINT "no_duplicate_user_in_chat_check" DO NOTHING;
			`, [groupNames[0].id, userId, groupNames[1].id, userId]);
            await pubSubServiceClient.group(group.name).addUser(userEmail);
        }
        res.json({});
    } catch (e) {
        console.error(`Can't subscribe the user ${userId}`, e);
        res.json({
            "error": e.message
        });
    }
});

app.post('/api/chats/1/messages', validateToken, async (req, res) => {
    console.log("Got send message request, body ", req.body)
    const userEmail = req.auth?.userEmail;  // Get from token
	const user = await connection.unsafe(`
		SELECT "id" FROM "public"."user"
		WHERE "email" = $1;
	`, [userEmail]);
	const currentUserId = user[0].id;

    const groupName = 'messages';
    const message = {
        message: req.body.payload,
        typeId: req.body.typeId,
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
		req.body.teamId,
		1,
		currentUserId,
		req.body.payload
	]);

	const chat = await connection.unsafe(`
		SELECT "id" FROM "public"."chat"
		WHERE "name" = $1
	`, [groupName]);
	
	const receivers = await connection.unsafe(`
		SELECT 
			"email"
		FROM "public"."chat_partisipants" "cp"
		JOIN "public"."user" "u" ON "u"."id" = "cp"."user_id"
		WHERE "chat_id" = $1
		AND "user_id" != $2
	`, [chat[0].id, currentUserId]);

	console.log(receivers);

    for (const receiver of receivers) {
		await pubSubServiceClient.sendToUser(receiver.email, message, {
			filter: `'${groupName}' in groups`,
			messageTtlSeconds: 10
		});
	}
    res.json({});
});

// app.get('/api/chats/1/messages', async (req, res) => {
//     const currentUserId = req.auth?.userEmail;  // Get from token
// 	const groupName = 'messages';

// 	const lastMessages = await connection.unsafe(`
// 		SELECT * FROM "public"."message"
// 		WHERE "created_at" < NOW()
// 		AND "created_at" >= NOW() - INTERVAL '1 DAY'
// 		LIMIT 10;
// 	`);

// 	console.log(lastMessages);

// 	res.json({});
// })

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
