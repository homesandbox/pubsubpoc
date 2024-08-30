## Folders structure
 - ### api - Backend API
 - ### web - Frontend UI
 - ### db - Database scripts
 - ### ias - Infrastructure as a code (terraform)


GET /api/teams/negogiate

GET /api/teams/{team_id}/messages?limit=10&offset=0&sort=asc&reference_id=1
```text
{
    "payload": "Text | linkToImage",
    "typeId": 1,
    "sentBySelf": true
}
```

POST /teams/{teamId}/messages
```text
{
    "payload": "Text | attachmentId",
    "typeId": 1
}
```