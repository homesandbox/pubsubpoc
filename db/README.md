## Tables

### message
  - id(autogenerated)
  - team_id(index)
  - type_id
  - sender_id
  - payload(text)
  - created_at

### message_type
  - id
  - name

### chat
  - id(autogenerated)
  - azure_hub_id
  - created_at
 
### chat_participats
  - id(autogenerated)
  - chat_id 
  - user_id
  - created_at
