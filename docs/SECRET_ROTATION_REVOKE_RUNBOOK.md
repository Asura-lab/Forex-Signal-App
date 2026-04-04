# Secret Rotation and Revoke Runbook

Last updated: 2026-04-04

## Immediate Incident Response

1. Revoke all previously exposed credentials immediately.
2. Issue new credentials from providers.
3. Update secret managers only (Fly/Azure), never local dotenv.
4. Validate runtime boot with strict secret mode.

## Credential Classes

- `SECRET_KEY` (JWT signing)
- `MONGO_URI` credentials
- SMTP credentials (`MAIL_USERNAME`, `MAIL_PASSWORD`)
- Provider API keys (Gemini, AlphaVantage)

## Rotation Steps (Provider-side)

### JWT secret

- Generate a new high-entropy key (`>=64` hex chars).
- Set it in Fly/Azure secret manager.
- Redeploy backend.
- Force logout all sessions if required.

### MongoDB credentials

- Create new DB user/password in MongoDB Atlas.
- Update connection string in secret manager.
- Revoke old DB user/password.

### SMTP credentials

- Create new app password.
- Update secret manager values.
- Revoke previous SMTP app password.

### API keys (Gemini/AlphaVantage)

- Revoke all old keys in provider portals.
- Issue replacement keys.
- Update secret manager values.

## Fly Secret Manager Example

```bash
fly secrets set SECRET_KEY=<new> -a predictrix-api
fly secrets set MONGO_URI=<new> -a predictrix-api
fly secrets set MAIL_USERNAME=<new> MAIL_PASSWORD=<new> -a predictrix-api
fly secrets set GEMINI_API_KEY_1=<new> -a predictrix-api
```

## Azure App Service Example

```bash
az webapp config appsettings set \
  --name Predictrix \
  --resource-group <rg> \
  --settings SECRET_KEY=<new> MONGO_URI=<new>
```

## Verification Checklist

- Backend starts with `STRICT_RUNTIME_SECRETS=true`.
- `ALLOW_LOCAL_DOTENV` is ignored/disabled.
- Health endpoint is green.
- Login, refresh, and logout flows succeed.
- Old credentials are confirmed revoked in provider dashboards.
