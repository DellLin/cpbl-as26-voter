# cpbl-as26-voter

An automated voting bot for the 2026 CPBL All-Star Game fan vote.

Votes immediately on startup, then schedules recurring votes at 01, 07, 13, and 19 o'clock with randomized minutes and seconds each day.

---

## Stack

- **playwright** — opens a browser to complete LINE login and intercept the access token
- **axios** — calls the voting API
- **date-fns** — schedule time calculation

---

## Preview

![screenshot](assets/screenshot.png)

---

## Getting Started

### Install dependencies

```bash
# npm
npm install
npx playwright install chromium

# yarn
yarn install
npx playwright install chromium
```

### Launch

```bash
# npm
npm start

# yarn
yarn start
```

This is the only entrypoint. It starts voting immediately, then runs the recurring scheduler.

### Non-interactive mode (for automation / Docker)

The app now supports a non-interactive startup path:

- it starts the scheduler directly
- it does not require CLI prompts
- by default it does not open a browser to refresh token

Environment variables:

| Variable                          | Default   | Description                                                    |
| --------------------------------- | --------- | -------------------------------------------------------------- |
| `SESSION_DIR`                     | `session` | Directory containing session files                             |
| `ALLOW_INTERACTIVE_TOKEN_REFRESH` | `false`   | If `true`, Playwright login flow is allowed when token expires |

### Voting schedule

After the immediate startup vote, the scheduler picks the next upcoming hour from `[01, 07, 13, 19]` and fires at a random minute and second within that hour. If no upcoming hour exists in the current day, it schedules for 01:xx the next morning.

### Token refresh

When `ALLOW_INTERACTIVE_TOKEN_REFRESH=false` (default), the app will not open a browser. If token is missing or expired, it exits with an error and asks you to provide a fresh `token.json`.

If you set `ALLOW_INTERACTIVE_TOKEN_REFRESH=true`, the app can still use Playwright login flow to capture a new token.

---

## Session files

All session files are local files and can be moved to any directory via `SESSION_DIR`.

| File                      | Purpose                                                           |
| ------------------------- | ----------------------------------------------------------------- |
| `session/candidates.json` | Selected candidate `searchId` list (required for vote submission) |
| `session/auth.json`       | Playwright browser storage state (cookies / localStorage)         |
| `session/token.json`      | LINE access token and capture timestamp                           |

For Docker usage, mount this folder from host and manage files yourself.

---

## Docker

### Build image

```bash
docker build -t cpbl-as26-voter .
```

### Prepare external session folder

Create a host folder and place at least these files inside:

- `auth.json`
- `token.json`
- `candidates.json` (required for vote submission)

Example:

```bash
mkdir -p ./session
```

### Run container

```bash
docker run --rm \
	-e SESSION_DIR=/data/session \
	-e ALLOW_INTERACTIVE_TOKEN_REFRESH=false \
	-v "$(pwd)/session:/data/session" \
	cpbl-as26-voter
```

If `token.json` is expired and `ALLOW_INTERACTIVE_TOKEN_REFRESH=false`, the app will fail fast with a clear error and exit.

---

## Disclaimer

This project is intended for personal learning and technical research purposes only. The author takes no responsibility for any account suspension, service interruption, or other damages resulting from the use of this software. Use at your own risk and ensure compliance with CPBL's terms of service.

If you are an official representative of CPBL and believe this project infringes upon your rights, please contact the author via email. The project will be taken down promptly upon a valid request.
