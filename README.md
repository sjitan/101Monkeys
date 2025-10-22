# 101Monkeys — Adaptive Coherence Protocol (MVP)

Closed-loop Edge–Cloud system that measures autonomic dysregulation (rPPG → HRV), selects and delivers a targeted behavioral nudge, and logs the post-intervention response. This branch includes **CORS**, **/pacer/log integration**, **async pseudonymizer**, **request validation**, and a public **Saga of Context** page.

## Architecture

| Component   | AWS Service                       | Function |
|-------------|-----------------------------------|----------|
| API         | API Gateway (HTTP) + custom domain `api.101monkeys.com` | Routes `/pacer/data`, `/pacer/log`, CORS, Cognito JWT authorizer |
| Compute     | Lambda                            | Decision engine, post-session logger, pseudonymizer, onboarding, Stripe webhook |
| Data        | DynamoDB                          | `YogaProtocolLibrary`, `ANSLongitudinalData`, `UserProfiles`, `AnonymizedTrainingData` (PITR + TTL) |
| Identity    | Cognito                           | JWT auth for API |
| Secrets     | KMS + Secrets Manager             | `phi/pseudonymizer/salt` guarded by CMK (`alias/phi-salt`) |
| Hosting     | Amplify (S3/CloudFront)           | Static frontend (`/app`) + `config/config.json` |
| Monitoring  | CloudWatch                        | `LambdaErrors > 0`, `APIGateway5XX > 0` |

### DynamoDB tables

- **YogaProtocolLibrary** — `PK: ProtocolID (S)`; `Name (S)`, `VideoURL (S)`
- **ANSLongitudinalData** — `PK: UserID (S)`, `SK: Timestamp (S)`; `RMSSD`, `RMSSD_Post_Protocol`, `ProtocolIDApplied`, `PEMSeverityScore`; **TTL** `ttl`
- **UserProfiles** — `PK: UserID (S)`; `Email`, `is_active_subscriber`, `StripeCustomerID`
- **AnonymizedTrainingData** — `PK: AnonID (S)`, `SK: Timestamp (S)`; `RMSSD`, `ProtocolIDApplied`, `PEMSeverityScore`; **TTL** `ttl`

### Lambdas

| Function                    | Purpose |
|----------------------------|---------|
| `onboarding/user_onboarding.py` | Post-signup write of `UserID`, membership flag |
| `pacer/pacer_decision_engine.py` | Read HRV, pick protocol, log to `ANSLongitudinalData`, **async invoke** `phi_pseudonymizer` |
| `pacer/log_post_protocol_data.py` | Update post-session (`RMSSD_Post_Protocol`, optional `PEMSeverityScore`) |
| `data/phi_pseudonymizer.py` | Derive `AnonID` from `userId` with KMS-protected salt; write to `AnonymizedTrainingData` |
| `security/stripe_webhook_handler.py` | Verify signature, set `is_active_subscriber=true` |

### Frontend contracts

- `/app/js/cv_sensor.js` → captures HRV (rPPG) → `POST /pacer/data`
- `/app/app.html` → displays returned `cueUrl`, posts session to `/pacer/log`
- `/app/js/cognito_auth.js` → obtains & injects JWT
- `/config/config.json` → `{ "API_BASE_URL": "https://api.101monkeys.com" }`
- `/app/context.html` → public-facing **Saga of Context**

---

## API (contract summary)

- `POST /pacer/data`
  Body: `{ userId: string, rmssd: number, timestamp?: ISO8601, pupilDiameterPV?: number, gazeStabilityScore?: number, pemScore?: number }`
  Returns: `{ protocolId: string, cueUrl: uri }`
  Headers: `Authorization: Bearer <JWT>`, `x-idempotency-key: <uuid>` (recommended)

- `POST /pacer/log`
  Body: `{ userId: string, protocolId: string, rmssdPost: number, timestamp: ISO8601, pemScore?: number }`
  Returns: `{ ok: true }`
  Headers: `Authorization: Bearer <JWT>`, `x-idempotency-key: <uuid>` (recommended)

**CORS**: enabled for `https://101monkeys.com`, `https://www.101monkeys.com`, and `https://*.101monkeys.com` (and `*` in dev).

---

## Deploy

```bash
bash infra/deploy.sh
```

What deploy.sh does in addition to existing stack:
	•	wires Cognito JWT authorizer to both routes,
	•	enables CORS,
	•	sets CloudFront cache hints (immutable static assets),
	•	ensures both routes are mapped and async invoke perms are set,
	•	outputs smoke-test curl examples.

⸻

Monitoring
	•	CloudWatch Alarms:
	•	LambdaErrors > 0
	•	APIGateway5XX > 0
	•	Enable structured JSON logs (service, fn, userId, traceId, etc.) in Lambda.

⸻

Compliance guardrails
	•	No PHI in logs (strict JSON fields, no raw email/phone in CloudWatch).
	•	KMS decrypt allowed only to phi_pseudonymizer.
	•	Cognito-gated endpoints (JWT required).
	•	x-idempotency-key support to reduce duplicate writes/retries.

⸻

Context & Theory (for Jules & stakeholders)
	•	Read the full “Saga of Context” here: /context/saga_of_context.md
and public page: /app/context.html

It covers:
	•	scientific premise (ANS dysregulation across CFS/ME, T2D),
	•	closed-loop control (measure → decide → actuate → measure),
	•	digital biomarkers (rPPG HRV, respiration), adaptive therapeutics,
	•	Emergent Coherence (Joe Dispenza): positioned as hypothesis/heuristic about group-level entrainment and intention-mediated coherence; not clinical guidance; used to motivate research questions and design ethically safe, measurable experiments (e.g., blinded rPPG HRV deltas around group sessions), separate from MVP claims.

⸻

Quick smoke tests

# data (expect protocol)
curl -X POST https://api.101monkeys.com/pacer/data \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -H "x-idempotency-key: $(uuidgen)" \
  -d '{"userId":"U1","rmssd":22,"timestamp":"2025-10-21T23:20:00Z"}'

# log (expect ok:true)
curl -X POST https://api.101monkeys.com/pacer/log \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -H "x-idempotency-key: $(uuidgen)" \
  -d '{"userId":"U1","protocolId":"BREATH_1","rmssdPost":31,"timestamp":"2025-10-21T23:22:00Z","pemScore":0.2}'
