# 101Monkeys — Adaptive Coherence Protocol (MVP)

### Vision
Serverless Edge–Cloud feedback loop that measures ANS dysregulation (HRV via rPPG), delivers targeted behavioral nudges, and logs physiological recovery.

### Architecture Summary
| Component | AWS Service | Function |
|------------|-------------|-----------|
| API Gateway | Custom domain (`api.101monkeys.com`) | Routes `/pacer/data` and `/pacer/log` |
| Lambda | PacerDecisionEngine / LogPostProtocolData / phi_pseudonymizer | Decision, compliance, and pseudonymization |
| DynamoDB | 4 Tables | PITR + TTL enabled |
| Cognito | JWT auth | Secures API access |
| KMS + Secrets Manager | Salt + key decrypt boundary | HIPAA compliance |
| Amplify / CloudFront | Frontend hosting | `/app/` + `config/config.json` |
| CloudWatch | Error + 5XX alarms | Monitoring baseline |

### DynamoDB Tables
- `YogaProtocolLibrary` — protocol definitions (ID, Name, VideoURL)
- `ANSLongitudinalData` — user HRV logs (PK UserID, SK Timestamp)
- `UserProfiles` — subscriber info
- `AnonymizedTrainingData` — pseudonymized RL dataset

### Lambdas
| Function | Purpose |
|-----------|----------|
| `user_onboarding.py` | Runs post-Cognito signup; writes `UserID` and membership flag. |
| `pacer_decision_engine.py` | Reads HRV; selects nudge; logs; asynchronously invokes pseudonymizer. |
| `log_post_protocol_data.py` | Updates logs after user session; appends PEM data. |
| `phi_pseudonymizer.py` | Hashes user ID → anon key; writes anonymized data. |
| `stripe_webhook_handler.py` | Verifies payments; updates active flag. |

### Frontend Contracts
- `/app/js/cv_sensor.js` — captures HRV → `POST /pacer/data`
- `/app/app.html` — displays adaptive cue + collects feedback
- `/app/js/cognito_auth.js` — manages JWTs
- `/config/config.json` — `{ "API_BASE_URL": "https://api.101monkeys.com" }`

### Deployment
```bash
bash infra/deploy.sh
```

### Monitoring

- `LambdaErrors > 0`
- `APIGateway5XX > 0`

### Compliance

- No PHI in logs
- KMS key limited to pseudonymizer Lambda
- IAM: least privilege

---

## 🧮 Fixes Applied (from Gemini + internal audit)

| Issue | Resolution |
|-------|-------------|
| Missing `LogPostProtocolData` integration | Added Lambda creation + API mapping to `/pacer/log`. |
| Pseudonymizer not invoked from decision engine | Updated handler to asynchronously invoke pseudonymizer via AWS Lambda invoke API. |
| Frontend config unclear | Explicitly added `/config/config.json` hosted in Amplify/S3. |
| CORS | Enabled for `https://101monkeys.com` + `www` + `*` for testing. |
