# Hanna Agent Firebase Functions

`resetWeeklyCredits` runs every Monday at 00:00 UTC. It updates each existing `users/{uid}/private/account` document to a 2,500-credit weekly balance and stores the UTC Monday date in `weeklyCreditWeek`. It is idempotent within a week, uses stable document-ID pagination, and commits no more than 450 account writes per Firestore batch.

The function complements the client-side lazy rollover: accounts are initialized/refreshed on sign-in, while this scheduled job also refreshes inactive accounts. Since both use the same `weeklyCreditWeek` field, repeat or delayed executions do not reset a balance twice in the same week.

## Deploy

1. Install the Firebase CLI (`npm install --global firebase-tools`) and the Functions dependencies, then authenticate and deploy to the Firebase project that owns this app's Firestore database:

   ```sh
   npm ci --prefix functions
   firebase login
   npm --prefix functions test
   firebase deploy --only functions:resetWeeklyCredits --project <firebase-project-id>
   ```

Firebase creates the Cloud Scheduler job as part of scheduled-function deployment. The project must have the Cloud Scheduler API enabled and be on the Blaze plan because scheduled functions use Cloud Scheduler and billed Google Cloud resources. No client secrets are required; the function uses its Firebase Admin service identity.

Run the function unit tests with:

```sh
npm --prefix functions test
```
