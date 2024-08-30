## Folders structure
 - ### api - Backend API
 - ### web - Frontend UI
 - ### db - Database scripts
 - ### ias - Infrastructure as a code (terraform)



GET /api/chats/negogiate

POST /api/chats/subscribe
```text
{
    "groups":["?"]
}
```

GET /api/chats?teamId=1121
```text
{
    "chats":[{
    "chatId": 123,
    "name": "Chat name"
    }]
}
```

GET /api/chats/{chatId}/messages?limit=10&offset=0&sort=asc&reference_id=1
```text
{
    "payload": "Text | linkToImage",
    "typeId": 1,
    "sentBySelf": true
}
```

POST /chats/{chatId}/messages
```text
{
    "chatId": 123,
    "payload": "Text | attachmentId",
    "typeId": 1
}
```