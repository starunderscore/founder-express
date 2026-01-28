# Email Provider Setup

This project supports selecting one email provider out of the box:

- SendGrid — requires `SENDGRID_API_KEY`
- Resend — requires `RESEND_API_KEY`

## Steps

1) Add the API key to your server environment

- For SendGrid, set `SENDGRID_API_KEY` to your SendGrid API key.
- For Resend, set `RESEND_API_KEY` to your Resend API key.

2) Restart the server/app so the new environment variables are loaded.

3) Go to `Employee → Company settings → Email → Configure` and pick the active provider.

Only one provider can be selected at a time. Providers only appear as selectable if their environment variable is present.

## Notes

- Never expose API keys to the browser. This app checks for provider availability via a server-side API that returns only whether a key exists, not the key value.
- After switching providers, ensure any provider-specific sender or domain settings are properly configured on the provider’s dashboard.
