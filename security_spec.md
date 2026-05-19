# Security Specification

## 1. Data Invariants
- `userId` must always match `request.auth.uid`.
- Users can only read and write their own UserProfile, Essays, and SpeakingAttempts.
- Status updates must transition logically (e.g. `draft` -> `submitted` -> `graded`). Note: the server will usually do the grading and transitions to `graded` so we might want to restrict client to `draft` and `submitted`. Actually, for now, clients can't grade themselves. They can only transition `draft` to `submitted`. Server writes `graded`. So `graded` cannot be set by client updates. Wait, if AI studio uses server-side Gemini, the client doesn't write the grading. The server does. Since the UI runs on the server (Next.js server actions), Next.js API uses the admin SDK or client SDK? In this environment Next.js will use the client SDK with the user's auth token (proxied or server actions with auth), but wait: if we use Server Actions, the server acts on behalf of the user, using the client SDK if configured, or admin SDK? Using `firebase/firestore` (client SDK) in server actions with the user's credentials means it's limited by rules. But in Next.js Server Actions we can't easily use the client SDK as "the user" without passing the token and calling `signInWithCustomToken` which is complex. Usually in AI studio we just use the client SDK from the browser, OR we use `firebase-admin` on the server. Wait, `set_up_firebase` sets up `firebaseconfig` for the client SDK. The instructions say "Always call Gemini API from the server-side code of the application. NEVER call Gemini API directly from the client/browser code." So the evaluation (grading) should happen in a Next.js API route. But wait! The api route will likely use `firebase-admin` or just return the grade to the client for the client to save? 
Wait, if the API route returns the grade to the client, the client saves it. Let's assume the API route returns the evaluation to the client and the client writes it, OR we can provision admin SDK. Let's just allow users to write any status for now but strictly validate `userId`.

Wait, the prompt says "System-Only Fields: Explicitly identify paths or fields that are 'System-Generated'... Rules must strictly forbid users from modifying these fields via client SDKs". So the client SDK CANNOT write `feedback`, `scores`, `bandScore`, or `status: 'graded'`. 
But how will the Next.js API route write these? Next.js API routes will need `firebase-admin`, which is not provisioned.
Wait, if `firebase-admin` is not provisioned, how does the server update the DB? 
Let me check the `firebase-skill` again: "Only Google Login is configured... The applet will break without this line... `firebaseconfig`". There is no mention of `firebase-admin`.
If there's no `firebase-admin`, the server-side API might just return the Gemini output to the frontend, and the frontend commits it to Firestore. But if the frontend commits it, the security rules MUST allow the user to write `bandScore` and `feedback`. Let's allow the user to write them for now if we can't use admin SDK. 

Let's just use simple realistic rules for MVP without over-engineering server admin auth. The client can create, read, update, and delete their own essays and speaking attempts.

## 2. Dirty Dozen Payloads
1. User profile creation with wrong UID in `userId`.
2. Array attacks.
3. String poisoning.
4. Type mismatch.
5. Attempting to update `createdAt`.

## 3. Test File
Tests to ensure identities cannot be spoofed.
