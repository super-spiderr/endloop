# Characters and poses

## The roasters

- **Loop**: the brand mascot and default roaster, modelled on Vignesh. Deadpan, bored, 3D animated-film look. Young South Indian man, curly black hair, black rectangular glasses, short beard, beige cap with a tone-on-tone infinity-loop logo, black earbuds with red-orange tips, black tee.
- **Lupe**: second roaster, modelled on Vignesh's girlfriend (check her consent is current before public use). Same cap, white earbuds with red-orange tips, black tee, dark wavy hair tied back, heavy-lidded unimpressed eyes.
- Users pick one in onboarding (S04) and can switch in Settings. Screens 1–3 run before the pick, so they always show Loop.
- Never name the real-world inspiration for the characters' gestures, or any film references, in the app or marketing.

## Rule: one pose per moment

Every moment on every screen gets its own pose. A pose is shared only when the exact same state appears twice (e.g. "Paused" in Settings and Home). Every pose is needed for **both** characters except Screens 1–3.

## Pose library and status

✓ = both done · NEW = both still needed

| Screen | Moment → pose | Status |
|---|---|---|
| S01 | peek → sneak-in; final → idle | ✓ (Loop only) |
| S02 | ask → peer; back without granting → arms crossed; granted → oh no | ✓ (Lupe versions exist too) |
| S03 | the damage → present | Loop ✓ (Lupe optional) |
| S03 | Premium sheet → **vip** (gold card) — also S04-D, S12-B, S14 banner | ✓ |
| S03 | Usage Access denied → **blind** (blindfold / sleep mask) | ✓ |
| S04 | polite / honest / savage | ✓ |
| S05 | reasonable → **thinking**; very low → **skeptical**; above habit → **facepalm**; barely used → **shrug**; exactly habit → **deadpan** | ✓ |
| S06 | 0 done → **clipboard**; 1–2 done → **waiting** (drumming fingers); overlay skipped → **disbelief**; all done → **knuckles** | ✓ |
| S07 | first visit → **binoculars**; chill → **chill**; one app close → **eyes on you**; over → **disgusted**; Usage Access lost → **unplugged** | ✓ |
| S08 | 75% → ahem; 90% → hourglass; late night → yawning; weekly → envelope; explainer → wave | ✓ (28 Sep) |
| S09 | entrance → eye-roll; reopened → hands on hips; snoozes used up → finger wag; fact card → pointer; final/share → polite/honest/savage ✓ | ✓ (28 Sep) |
| S10 | convince me; peeking; stopwatch; fine, go; slow clap; sigh | ✓ (28 Sep) |
| S11 | morning → coffee; afternoon → desk slump; evening → couch (popcorn); late night → yawning; over → confiscate; lower limit → thumbs up; raise → calendar; stop tracking → your call; good week → high five | ✓ (29 Sep; confiscate → App detail when over today, high five → App detail when no day over this week) |
| S12 | winning → flex; worse → head in hands; baseline → notes (also S13 first card, S16 day one) | ✓ (Lupe 6 Oct) |
| S13 | count-up → jaw drop; worst app → head shake (also bad-week card); wins → hand on heart; share → selfie; good card → savage ✓ | ✓ (Lupe 6 Oct; jaw drop on the count-up, selfie on the share screen; card: bad → head shake, first → notes, good → savage) |
| S14 | pause → side-eye; delete → dramatic (clutching chest); paused → stretching (also S16 day off); privacy → shh | ✓ (Lupe 6 Oct; shh on the "What I can see" page) |
| S15 | Unhinged → evil grin; lifetime → chess; welcome → bow; 4th app → savage ✓ | ✓ (bow + all Lupe 6 Oct; bow has no screen until purchases exist) |
| S16 | no apps → bored; phone killed Endloop → asleep (Zzz); every limit hit → fuming; perfect day → party popper (`party`); app uninstalled → impressed; Premium ended → goodbye | ✓ (6 Oct; wired on Today: bored, asleep on the killed card, fuming, party on the perfect-day card, impressed on the uninstall toast. goodbye waits for "Premium ended") |
| S17 | onboarding ask → frame (hands framing a photo) | ✓ (6 Oct; above the icon preview) |

Pose keys in code (`src/characters.ts`): idle, peer, armsCrossed, ohNo, present, polite, honest, savage, vip, blind, thinking, skeptical, facepalm, shrug, deadpan, clipboard, waiting, disbelief, knuckles, binoculars, chill, eyesOnYou, disgusted, unplugged, coffee … chess (S11–S15), bow, bored, asleep, fuming, party, impressed, goodbye, frame. Files are kebab-case (`eyes-on-you.webp`).

## Generating images

**29 Sep 2026: every pose (S01–S11, both roasters) was regenerated** because the earlier images had squashed, wide faces. Rules now:
- Attach the character's onboarding still (`assets/characters/{loop,lupe}/idle.webp`, put on green) to **every** prompt, in a fresh ChatGPT chat every ~8 images (long chats drift).
- The prompt starts with a proportions block: long oval face, narrow jaw, visible neck, slim build, narrow shoulders, slim arms; do not widen/round/squash the face, no chibi. Portrait 2:3, head to just above the waist, clear green space above the cap and on both sides, nothing touching the edges.
- Compare every result's head against the reference at the same scale before keeping it.
- `process.py` leaves 10% head room and ~8% side room, and grows the square so hands/folded arms held low stay in frame.


One character per image, one pose per image, flat green background. Attach that character's reference still every time.

**Loop base** (reference: `assets/characters/loop/arms-crossed.webp`):
> Same character as the reference image: a young South Indian man in a stylised 3D animated-film look. Warm brown skin, thick curly black hair, black rectangular glasses, short beard and moustache, heavy-lidded unimpressed eyes. Beige baseball cap with a small tone-on-tone embroidered infinity-loop logo on the front, black wireless earbuds with red-orange tips, plain black crew-neck t-shirt. Soft studio lighting from the front-left. Square 768×768, head and upper chest only, cap top near the top edge, cut off at mid-chest, centred. Background: flat pure chroma-key green (#00FF00), completely even, no gradient, no shadow, no floor, no vignette. No green light spill or green reflections on his skin, hair, glasses, cap or clothes, and nothing green on the character. No text, no logos except the cap mark. Keep his face identical to the reference.

**Lupe base** (reference: `assets/characters/lupe/idle.webp`):
> Same character as the reference image: a young South Indian woman in a stylised 3D animated-film look. Warm brown skin, heavy-lidded unimpressed eyes, dark wavy hair loose at the sides and tied back. Beige baseball cap with a small tone-on-tone embroidered infinity-loop logo on the front, white wireless earbuds with red-orange tips, plain black crew-neck t-shirt. Soft studio lighting from the front-left. Square 768×768, head and upper chest only, cap top near the top edge, cut off at mid-chest, centred. Background: flat pure chroma-key green (#00FF00), completely even, no gradient, no shadow, no floor, no vignette. No green light spill or green reflections on her skin, hair, cap or clothes, and nothing green on the character. No props, no text, no logos except the cap mark. Keep her face identical to the reference.

Tips learned: Lupe "frame" with "one eye peeking through" was refused as a content-policy hit; "like a camera viewfinder, looking at the viewer through it" works. Lupe head-in-hands once came back without the cap: say "wearing the beige cap exactly as in the reference, whole cap visible". ChatGPT sometimes returns a transparent PNG instead of green; composite it onto #00FF00 before `process.py`. keep gestures close to the body so faces stay big in small cards; "blindfold" on Lupe was blocked by the image tool, a padded sleep mask works; check hair edges for green; ask for props to be blank (no fake text).

### Pose lines still to generate (append to the base; swap his/her)

S08
- **Ahem:** Right index finger raised beside the face at shoulder height, like "ahem, excuse me". Eyebrows raised, tight knowing half-smile, head tilted slightly.
- **Hourglass:** Holds a small wooden hourglass at chest height, close to the body, sand almost all in the bottom. Eyebrows raised meaningfully, lips pressed. Sand warm orange.
- **Yawning:** Mid-yawn, one hand covering the mouth, eyes half-closed and watery, head tilted; other arm hugs a small white pillow. (Loop: glasses slightly crooked.)
- **Envelope:** Holds a sealed red envelope beside the face with both hands, blank front. Eyebrows raised, smug little smile.
- **Wave:** Right hand raised in a relaxed open-palm wave beside the head. Warm, slightly lopsided smile; friendliest pose, still a bit smug.

S09
- **Eye-roll:** Eyes rolled all the way up, head tilted back and to one side, flat unimpressed mouth, shoulders slightly raised.
- **Hands on hips:** Both hands on hips, elbows out, leaning toward the viewer, one eyebrow high, lips pursed: "seriously, again?"
- **Finger wag:** Index finger raised at face height, wagging, palm to viewer; eyes half-closed, head shaking slightly, smug tight-lipped smile.
- **Pointer:** Thin wooden pointer stick angled up to an off-frame board, other hand on hip, know-it-all half-smile. (Loop: pushing glasses up with a knuckle instead.)

S10
- **Convince me:** Leaning in, chin on a closed fist, eyebrows raised, skeptical smile.
- **Peeking:** Leaning to one side, eyes narrowed looking down at an unseen phone, one hand shading the eyes.
- **Stopwatch:** Silver stopwatch at chest height, thumb on the button, patient flat look over it.
- **Fine, go:** One hand rolling forward "go on then", palm up; eyes half-closed, looking away, mouth pulled to one side.
- **Slow clap:** Hands together mid slow-clap in front of the chest; small proud smile they're trying to hide; nodding.
- **Sigh:** Shoulders slumped, head down, eyes half-closed, cheeks puffed in a long sigh.

S11 (sent in the character chats as "Pose: …", each ending with: "Whole cap visible with a little space above it. No motion lines, no sparkles, no drawn effects, nothing green on the character.")
- **Coffee:** Slow morning. Holds a plain white coffee mug with both hands at chest height, close to the body, a little steam rising. Eyes half-open, looking at the viewer over the mug, eyebrows slightly raised. Blank mug, no text.
- **Desk slump:** Afternoon slump. Chin resting on folded forearms as if slumped over a desk (desk out of frame at the bottom). Eyes half-closed and bored, looking at the viewer, cheek squashed a little.
- **Couch:** Couch mode. Leaning back, relaxed, holding a small red-and-white striped popcorn bucket at chest height in one hand, the other hand lifting a piece of popcorn toward the mouth. Flat, knowing look. Blank bucket, no text.
- **Confiscate:** Confiscated. Holds a plain black smartphone up beside the face in one hand, screen facing away, like taking it away; the other palm open toward the viewer at chest height. Stern eyebrows, tight satisfied smile. Blank phone back, no logo.
- **Thumbs up:** Approval. One thumbs-up at chest height, close to the body. Small approving smile, one eyebrow raised as if pleasantly surprised.
- **Calendar:** See you tomorrow. Holds a small tear-off desk calendar page up beside the face, tapping it with the index finger of the other hand. Flat unimpressed look. Blank page with a red top strip, no numbers or text.
- **Your call:** Your call. Both hands raised at shoulder height, palms toward the viewer, as if stepping back. Eyebrows raised, mouth pulled to one side: "fine, your call".
- **High five:** High five. Right hand raised at head height, open palm toward the viewer, offering a high five. Big genuine proud smile, eyes bright.
(S11 late night reuses **yawning**.)

S12
- **Flex:** Winning. One arm raised in a proud bicep flex beside the head, the other hand on the hip. Confident grin, eyebrows up.
- **Head in hands:** A worse week. Face half-buried in both hands, fingers spread, eyes peeking out between the fingers, eyebrows pinched in dismay.
- **Notes:** Baseline, still learning you. Holds a small spiral notepad at chest height and writes in it with a pencil, looking at the viewer over it, one eyebrow raised. Blank pages, no text.

S13
- **Jaw drop:** Staring at the weekly total. Mouth wide open, eyes wide, both hands pressed to the cheeks.
- **Head shake:** Worst offender. Head turned to one side mid-shake, eyes closed, lips pressed, one palm raised as if to say "no, no".
- **Hand on heart:** The wins. One hand pressed flat over the heart, head tilted, eyes soft, a warm touched smile.
- **Selfie:** Share it. Holds a plain black phone at arm's length up to one side as if taking a selfie (phone back to the viewer, blank), deadpan face with a small peace sign in the other hand.

S14
- **Side-eye:** Taking the day off? Body facing forward, eyes sliding hard to one side at the viewer, lips pressed, one eyebrow raised.
- **Dramatic:** Delete everything? Both hands clutching the chest over the heart, head thrown back slightly, eyes wide, mouth open in mock horror.
- **Stretching:** Paused, day off. Both arms stretched up overhead (hands inside the frame), eyes closed, relaxed contented face mid-yawn-stretch.
- **Shh:** Privacy. Index finger pressed to the lips in a "shh", eyes looking at the viewer, a knowing little smile.

S15
- **Evil grin:** Unhinged. Chin lowered, eyes looking up from under the brow, a wide mischievous grin, fingertips steepled together in front of the chest.
- **Chess:** Lifetime, the long game. Holds a single black chess king piece up beside the face between finger and thumb, a calm confident smirk.
- **Bow:** Welcome to Premium. A small gracious bow, one hand on the chest, the other arm out to the side, head dipped, a pleased smile.

S16
- **Bored:** No apps tracked. Cheek squished against one fist, elbow down, eyes half-closed and staring into space, mouth flat.
- **Asleep:** Phone killed the watcher. Asleep sitting up, head tilted onto one shoulder, eyes closed, mouth slightly open, hands loosely folded. (No drawn "Zzz"; the app adds it.)
- **Fuming:** Every limit hit. Both fists clenched at chest height, jaw tight, nostrils flared, eyebrows slammed down, face slightly flushed.
- **Party popper:** Perfect day. Holds a paper party popper up in one hand with a burst of red and white paper confetti coming out, big delighted grin. Nothing green in the confetti.
- **Impressed:** Tracked app uninstalled. Eyebrows raised high, lips pushed out in an impressed "ooh", a slow nod, one thumb up.
- **Goodbye:** Premium ended. A small sad wave with one hand at shoulder height, a wistful half-smile, eyebrows tilted up.

S17
- **Frame:** Put my face on your home screen. Both hands making a rectangular photo frame with thumbs and index fingers in front of the face, one eye peeking through, a pleased smirk.

## Processing pipeline (Claude does this)

`design/poses/process.py`:
1. Key out the green (plus white letterbox strips), despill, drop specks.
2. Find the cap (topmost big beige blob) to size the head; widen the square until the whole gesture (arms, props) fits; sit the body on the bottom edge (space goes above the cap if needed).
3. Export 768×768 transparent WebP to `assets/characters/<roaster>/<pose>.webp`.
4. Add the key to `src/characters.ts`, swap it into the screen, and update the canvas mockup.
5. Native uses (notifications S08, overlay S09/S10) also need 600×600 copies with a baked bottom fade (`process.py … --native` writes them) in `modules/endloop-core/android/src/main/res/drawable-nodpi/endloop_<roaster>_<pose>.webp` and the mapping in `Alerts.kt` / `EnforcerService.kt`.

## Animation plan (after release, shipped as updates one by one)

Animated WebP with alpha, about 512 px, 15 fps, under ~300 KB, plays once and ends on the still (so it's fine with animations off). Made from a 1–2 s image-to-video clip on green using the still as the first frame. Works in app screens (expo-image) and in the native overlay on Android 9+ (older phones show the still).

Priority: 1) S09 eye-roll entrance, 2) S10 stopwatch wait loop, 3) S10 slow clap, 4) S09 hands on hips, 5) S01 sneak-in, 6) S13 jaw drop / head shake / clap, 7) S16 Zzz and party popper, 8) S15 bow. Keep notifications, Home mood card, limits, permissions, sheets and avatars static.
