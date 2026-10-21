# Clients

The vanilla app in `server/public/`, rebuilt three times: React and Vue for the browser, React
Native for phones. Same server, same words, same stories — different answers to one question:
**when the state changes, how does the screen find out?**

| Client       | Folder             | Runs at                          | How a change reaches the screen                                                   |
| ------------ | ------------------ | -------------------------------- | --------------------------------------------------------------------------------- |
| vanilla      | `../server/public` | http://localhost:3000            | `render*()` functions rebuild the DOM by hand, and every caller must remember to call them |
| React        | `react/`           | http://localhost:3001            | a setter re-runs `App`; React compares the result with the last one and patches the DOM |
| Vue          | `vue/`             | http://localhost:3002            | each template records which `state` fields it read; writing one re-renders just those |
| React Native | `react-native/`    | Expo Go, on a phone or emulator  | the same as React, but the tree is native views (`View`, `Text`), not HTML         |

## What is shared, and what is not

`shared/` holds what must agree across every client, in plain JavaScript with no framework:

- `translations.js` — the eight language packs, copied from the vanilla app. `shared.test.js` fails
  if the two copies drift.
- `i18n.js` — `translate()`, the language list, date formatting.
- `roles.js` — which panels a user sees.
- `validation.js` — what counts as valid input: one rule per kind of value (username, password,
  role, id, count). A rule is a list of regular expressions, and a value is valid when it matches
  all of them, so each pattern states one requirement and an empty list accepts any text. Pure
  predicates are built from the rules (`isValidUsername`,
  `isValidLogin`, `isValidNewUser`, …). `loginError` and `newUserError` give the translation key
  of the reason a form is invalid. Every client runs them on its forms before sending. The server
  runs the same file on every request and answers with the English message. The vanilla
  page imports it from `/validation.js`, which Express serves from this folder.
  `validation.test.js` tests the rules on their own, with a table of what each must accept and
  refuse.
- `api.js` — every call to the server. It takes the two things that differ by platform: the server's
  address and where the token is kept.

Each client's own `src/api.js` is where the platform shows: the web clients use relative paths and
`localStorage`; the phone needs the server's address and keeps the token in the keychain
(`expo-secure-store`).

The rest has the same shape in every client, so the files can be read side by side:
`App`, the state (`useParking.js` in React and React Native, `store.js` in Vue), and
`components/` — `Hero`, `LanguagePicker`, `LotList`, `LanguagePanel`, `LoginPanel`, `AdminPanel`,
`SensorPanel`, `UsersPanel`. Things worth comparing:

- `react/src/useParking.js` against `react-native/src/useParking.js`. They are nearly the same file.
  The difference is storage: a browser reads it at once, a phone asynchronously.
- React passes the `parking` object down as a prop; Vue components import the one `state` object
  directly and Vue tracks what they read.
- React Native has no HTML: no `<select>` (`Choices` shows chips instead), no stylesheet cascade
  (each component names its styles), and `components/ui.js` rebuilds the panel, button and field
  that the web clients get from HTML and `styles.css`.

## Running

The web clients, from `parking/`:

```sh
docker compose up --build      # vanilla :3000, React :3001, Vue :3002
```

Each web container is nginx serving the built page and forwarding `/api` to the Express service, so
the page and the API share an origin exactly as they do for the vanilla app. The server needs no
CORS and no changes.

To edit with live reload, keep the stack running and start a dev server; Vite forwards `/api` the
same way:

```sh
cd clients/react && npm install && npm run dev     # http://localhost:5173
cd clients/vue && npm install && npm run dev       # http://localhost:5174
```

The phone client, with the stack running:

```sh
cd clients/react-native && npm install
npm run android     # opens in Expo Go on a running Android emulator
npm start           # or scan the QR code with Expo Go on a phone on the same network
```

The app expects the API on the computer that serves its JavaScript, port 3000. Set
`EXPO_PUBLIC_API_URL` to point it elsewhere. Expo Go allows plain `http`; a store build would need
`https`. `npm run ios` needs Xcode.

## Tests

```sh
cd clients/shared && npm test          # node:test, nothing to install
cd acceptance && npm install && npx playwright install chromium && npm test
cd clients/react-native && npm test
```

The last two need the stack running.

`acceptance/parking.spec.js` runs one set of stories against all three web clients. It finds things
the way a person does, by English text and labels, plus a few hooks every web client keeps: the panel
ids (`auth-panel`, `admin-panel`, `sensor-panel`, `users-panel`, `lot-list`) and the class names from
`styles.css` (`lot-card`, `badge`, `user-row`, `tag`).

`react-native/__tests__/App.test.js` tells the same stories to the React Native tree with React
Native Testing Library, using the same panel ids as `testID`s. A phone cannot run Playwright, so the
stories are shared and the runner is not.

Both suites change the database and put it back: River Garage open, North Deck's count restored, test
users deleted.

## Where the ports differ from vanilla, on purpose

1. **Staff panels really hide.** Vanilla sets the `hidden` attribute, but `styles.css` gives `.panel`
   `display: flex`, which overrides it — a guest sees every staff panel, and the login form stays
   after signing in. (The server still refuses a guest's requests.) The ports don't render the
   panels at all.
2. **Usernames are text.** Vanilla builds user rows with `innerHTML`, so an admin who named a user
   `<img src=x onerror=…>` ran script in every admin's browser, where the token sits in
   `localStorage`. JSX, Vue templates and `<Text>` all escape text. The server now refuses that
   name (`validation.js`), so the hole can no longer be reached. The `innerHTML` is still there:
   validating input and escaping output are separate defences, and vanilla has only the first.
3. **A half-typed occupancy survives the five-second refresh.** Vanilla resets the field each time.
4. **A failed refresh is reported under the lot list**, not in the admin panel a guest never sees.

The acceptance suite marks 1 as an expected failure for vanilla. If someone fixes vanilla, that
test reports "expected to fail, but passed", which is the cue to remove the mark.

## Sizes

What each client costs before it can show anything (production builds, gzip, all eight languages
included):

| vanilla | React | Vue   | React Native |
| ------- | ----- | ----- | ------------ |
| 13 KB   | 80 KB | 38 KB | 1.5 MB of Hermes bytecode per platform, installed with the app rather than downloaded per visit |
