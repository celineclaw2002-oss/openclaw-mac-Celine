# Body Transformation Plan

## Objective

Build a lean, athletic, V-tapered physique over 12–16 weeks while preserving muscle and maintaining a sustainable relationship with food.

## Starting framework (2026-09-14)

- Start at 2,600 kcal/day for 14 days, then adjust from measured trends.
- Daily targets: at least 180 g protein, 70–85 g fat, remaining calories from carbohydrates, and 30–40 g fiber.
- Target loss: 0.3–0.8% of body weight per week. Do not chase a fixed scale endpoint until the starting weight and waist are measured reliably.
- Training: five lifting days, one Zone 2/recovery day, one complete rest day; weights before cardio.
- Daily movement: maintain the existing 10,000–15,000 steps rather than forcing more.
- Recovery: approximately eight hours of sleep; alcohol should be reduced to 0–4 standard drinks weekly for best progress.
- Nutrition should remain flexible and varied, with Turkish meals included. Avoid aggressive restriction, compensatory exercise, and rigid all-or-nothing rules.

## Weekly training split

- Monday: Push
- Tuesday: Lower A + core
- Wednesday: Pull
- Thursday: Zone 2 cardio + mobility
- Friday: Upper aesthetic emphasis
- Saturday: Lower B + optional intervals
- Sunday: Full rest and weekly review

## Tracking and adjustments

- Obtain a reliable scale and flexible measuring tape.
- Record morning weight at least three times weekly under consistent conditions; compare weekly averages.
- Measure waist at the navel each Sunday morning and take front/side/back photos every four weeks.
- Hold calories constant for the first 14 fully adherent days.
- If average loss is below 0.3% per week for two weeks, reduce by 150 kcal/day or add 10 minutes to two cardio sessions.
- If average loss exceeds 0.8% per week, strength falls materially, or recovery deteriorates, add 150 kcal/day.

## Week 1 nutrition structure

- No breakfast is required. Use lunch, dinner, and an optional protein snack.
- Default meal timing: lunch around 12:00–14:00, protein snack around 16:00–18:00 when needed, and dinner around 20:00–22:00.
- Weigh meat raw and rice/pasta dry. Log the exact package labels, particularly for mince, protein pasta, salmon, chicken thighs, and short rib.
- Build the week around the groceries already available: chicken breast and thighs, salmon, shrimp, minced meat, short rib, rice, regular and protein pasta, potatoes, chickpeas, Greek yogurt, whey, berries, bananas, avocado, cucumber, eggplant, scallions, herbs, garlic, and limes.
- Default protein snack: 250–350 g Fage 2%, 30–40 g Optimum Nutrition whey, and 150–200 g berries or one banana.
- The seven-day rotation includes chicken shish rice bowls, shrimp protein pasta, Turkish mince and eggplant, salmon with potatoes and cacik, chicken-thigh rice bowls, kiymali protein pasta, kofte with potatoes, a controlled short-rib dinner, and chicken/shrimp combinations.
- Target approximately 2,600 kcal and at least 180 g protein daily; adjust measured starch, oil, avocado, and yogurt portions to reconcile label differences.

## Open items

- Confirm reliable starting weight and tape-measured waist.
- Confirm whether Sunday automated weekly plans should run, and at what time in America/New_York.
- Build each week's meal rotation around current groceries, freezer inventory, preferences, and results.

## Delivery

- On 2026-09-14, the combined training and seven-day diet plan was emailed to `canozgel@gmail.com` from the configured Celine Gmail account with subject `Your 12–16 Week Body Transformation Plan: Training + Diet`.
- A user-facing copy is stored at `plans/body-transformation-plan-email.txt`.

## Weekly automation

- Created enabled automation `weekly-body-transformation-checkin` (`64c935d3-2d09-4177-a132-cb88be4e04a4`; declaration key `fitness-weekly-checkin-v1`).
- Schedule: every Sunday at 18:00 in `America/New_York`, exact/no stagger.
- Delivery: WhatsApp direct to Can through the default account.
- The prompt requests current food inventory, consistent front/side/back photos, weight average, waist, workout/strength/recovery/step data, nutrition adherence, alcohol, and food preferences.
- After Can replies in the main conversation, build the next week's adjusted diet and workout plan and email it to `canozgel@gmail.com`.
- First scheduled run verified for Sunday, 2026-09-20 at 18:00 EDT.

## Risks and guardrails

- Photos and improvised cable measurements cannot establish an exact body-fat percentage.
- A past eating-disorder history warrants avoiding crash dieting and monitoring for returning binge/purge urges or compensatory behaviors; if they recur, pause the deficit and seek qualified clinical support.
- Medication questions or symptoms belong with the prescribing clinician; topical minoxidil currently has no reported side effects.
