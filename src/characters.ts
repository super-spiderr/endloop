/**
 * Character asset slots. Every screen asks for a pose by name; swapping art later
 * means replacing the file here, never touching screen code.
 */
export type Roaster = 'loop' | 'lupe';
export type Pose =
  | 'idle'
  | 'peer' // over the glasses, suspicious (Usage Access ask)
  | 'armsCrossed' // unimpressed
  | 'ohNo' // hand over mouth
  | 'present' // palms up, "it's that simple" (The damage)
  | 'polite'
  | 'honest'
  | 'savage'
  | 'vip' // S03 Premium sheet: holding a gold card
  | 'blind' // S03 Usage Access denied
  | 'thinking' // S05 reasonable
  | 'skeptical' // S05 very low
  | 'facepalm' // S05 above the habit
  | 'shrug' // S05 barely used
  | 'deadpan' // S05 exactly the habit
  | 'clipboard' // S06 0 done
  | 'waiting' // S06 1-2 done, drumming fingers
  | 'disbelief' // S06 overlay skipped
  | 'knuckles' // S06 all done
  | 'binoculars' // S07 first visit
  | 'chill' // S07 under limits
  | 'eyesOnYou' // S07 one app close
  | 'disgusted' // S07 over the limit
  | 'unplugged' // S07 Usage Access lost
  | 'coffee' // S11 heaviest part: morning
  | 'deskSlump' // S11 afternoon
  | 'couch' // S11 evening
  | 'yawning' // S11 late night (also the S08 late-night notification)
  | 'confiscate' // S11 over the limit
  | 'thumbsUp' // S11 lower limit
  | 'calendar' // S11 raise limit (from tomorrow)
  | 'yourCall' // S11 stop tracking
  | 'highFive' // S11 good week
  | 'flex' // S12 winning
  | 'headInHands' // S12 worse week
  | 'notes' // S12 baseline building (also S13 first week, S16 day one)
  | 'jawDrop' // S13 the total counts up
  | 'headShake' // S13 worst offender, bad-week card
  | 'handOnHeart' // S13 the wins
  | 'selfie' // S13 share
  | 'sideEye' // S14 pause for today
  | 'dramatic' // S14 delete all data
  | 'stretching' // S14 paused (also S16 day off)
  | 'shh' // S14 privacy
  | 'evilGrin' // S15 Unhinged
  | 'chess' // S15 lifetime / the long game
  | 'bow' // S15 welcome to Premium (no purchase flow yet)
  | 'bored' // S16 no apps tracked
  | 'asleep' // S16 the phone killed the watcher (the app adds the Zzz)
  | 'fuming' // S16 every limit hit
  | 'party' // S16 perfect day
  | 'impressed' // S16 tracked app uninstalled
  | 'goodbye' // S16 Premium ended (not built yet)
  | 'frame' // S17 app-icon ask
  | 'envelope'; // S08 weekly notification; also the Stats weekly-roast card

const loop = {
  idle: require('../assets/characters/loop/idle.webp'),
  peer: require('../assets/characters/loop/peer.webp'),
  armsCrossed: require('../assets/characters/loop/arms-crossed.webp'),
  ohNo: require('../assets/characters/loop/oh-no.webp'),
  present: require('../assets/characters/loop/present.webp'),
  polite: require('../assets/characters/loop/polite.webp'),
  honest: require('../assets/characters/loop/honest.webp'),
  savage: require('../assets/characters/loop/savage.webp'),
  vip: require('../assets/characters/loop/vip.webp'),
  blind: require('../assets/characters/loop/blind.webp'),
  thinking: require('../assets/characters/loop/thinking.webp'),
  skeptical: require('../assets/characters/loop/skeptical.webp'),
  facepalm: require('../assets/characters/loop/facepalm.webp'),
  shrug: require('../assets/characters/loop/shrug.webp'),
  deadpan: require('../assets/characters/loop/deadpan.webp'),
  clipboard: require('../assets/characters/loop/clipboard.webp'),
  waiting: require('../assets/characters/loop/waiting.webp'),
  disbelief: require('../assets/characters/loop/disbelief.webp'),
  knuckles: require('../assets/characters/loop/knuckles.webp'),
  binoculars: require('../assets/characters/loop/binoculars.webp'),
  chill: require('../assets/characters/loop/chill.webp'),
  eyesOnYou: require('../assets/characters/loop/eyes-on-you.webp'),
  disgusted: require('../assets/characters/loop/disgusted.webp'),
  unplugged: require('../assets/characters/loop/unplugged.webp'),
  coffee: require('../assets/characters/loop/coffee.webp'),
  deskSlump: require('../assets/characters/loop/desk-slump.webp'),
  couch: require('../assets/characters/loop/couch.webp'),
  yawning: require('../assets/characters/loop/yawning.webp'),
  confiscate: require('../assets/characters/loop/confiscate.webp'),
  thumbsUp: require('../assets/characters/loop/thumbs-up.webp'),
  calendar: require('../assets/characters/loop/calendar.webp'),
  yourCall: require('../assets/characters/loop/your-call.webp'),
  highFive: require('../assets/characters/loop/high-five.webp'),
  flex: require('../assets/characters/loop/flex.webp'),
  headInHands: require('../assets/characters/loop/head-in-hands.webp'),
  notes: require('../assets/characters/loop/notes.webp'),
  jawDrop: require('../assets/characters/loop/jaw-drop.webp'),
  headShake: require('../assets/characters/loop/head-shake.webp'),
  handOnHeart: require('../assets/characters/loop/hand-on-heart.webp'),
  selfie: require('../assets/characters/loop/selfie.webp'),
  sideEye: require('../assets/characters/loop/side-eye.webp'),
  dramatic: require('../assets/characters/loop/dramatic.webp'),
  stretching: require('../assets/characters/loop/stretching.webp'),
  shh: require('../assets/characters/loop/shh.webp'),
  evilGrin: require('../assets/characters/loop/evil-grin.webp'),
  chess: require('../assets/characters/loop/chess.webp'),
  bow: require('../assets/characters/loop/bow.webp'),
  bored: require('../assets/characters/loop/bored.webp'),
  asleep: require('../assets/characters/loop/asleep.webp'),
  fuming: require('../assets/characters/loop/fuming.webp'),
  party: require('../assets/characters/loop/party.webp'),
  impressed: require('../assets/characters/loop/impressed.webp'),
  goodbye: require('../assets/characters/loop/goodbye.webp'),
  frame: require('../assets/characters/loop/frame.webp'),
  envelope: require('../assets/characters/loop/envelope.webp'),
} satisfies Record<Pose, number>;

// Lupe has every pose too (Screen 3 runs before the roaster is picked, so present is rarely shown).
const lupe = {
  idle: require('../assets/characters/lupe/idle.webp'),
  peer: require('../assets/characters/lupe/peer.webp'),
  armsCrossed: require('../assets/characters/lupe/arms-crossed.webp'),
  ohNo: require('../assets/characters/lupe/oh-no.webp'),
  present: require('../assets/characters/lupe/present.webp'),
  polite: require('../assets/characters/lupe/polite.webp'),
  honest: require('../assets/characters/lupe/honest.webp'),
  savage: require('../assets/characters/lupe/savage.webp'),
  vip: require('../assets/characters/lupe/vip.webp'),
  blind: require('../assets/characters/lupe/blind.webp'),
  thinking: require('../assets/characters/lupe/thinking.webp'),
  skeptical: require('../assets/characters/lupe/skeptical.webp'),
  facepalm: require('../assets/characters/lupe/facepalm.webp'),
  shrug: require('../assets/characters/lupe/shrug.webp'),
  deadpan: require('../assets/characters/lupe/deadpan.webp'),
  clipboard: require('../assets/characters/lupe/clipboard.webp'),
  waiting: require('../assets/characters/lupe/waiting.webp'),
  disbelief: require('../assets/characters/lupe/disbelief.webp'),
  knuckles: require('../assets/characters/lupe/knuckles.webp'),
  binoculars: require('../assets/characters/lupe/binoculars.webp'),
  chill: require('../assets/characters/lupe/chill.webp'),
  eyesOnYou: require('../assets/characters/lupe/eyes-on-you.webp'),
  disgusted: require('../assets/characters/lupe/disgusted.webp'),
  unplugged: require('../assets/characters/lupe/unplugged.webp'),
  coffee: require('../assets/characters/lupe/coffee.webp'),
  deskSlump: require('../assets/characters/lupe/desk-slump.webp'),
  couch: require('../assets/characters/lupe/couch.webp'),
  yawning: require('../assets/characters/lupe/yawning.webp'),
  confiscate: require('../assets/characters/lupe/confiscate.webp'),
  thumbsUp: require('../assets/characters/lupe/thumbs-up.webp'),
  calendar: require('../assets/characters/lupe/calendar.webp'),
  yourCall: require('../assets/characters/lupe/your-call.webp'),
  highFive: require('../assets/characters/lupe/high-five.webp'),
  flex: require('../assets/characters/lupe/flex.webp'),
  headInHands: require('../assets/characters/lupe/head-in-hands.webp'),
  notes: require('../assets/characters/lupe/notes.webp'),
  jawDrop: require('../assets/characters/lupe/jaw-drop.webp'),
  headShake: require('../assets/characters/lupe/head-shake.webp'),
  handOnHeart: require('../assets/characters/lupe/hand-on-heart.webp'),
  selfie: require('../assets/characters/lupe/selfie.webp'),
  sideEye: require('../assets/characters/lupe/side-eye.webp'),
  dramatic: require('../assets/characters/lupe/dramatic.webp'),
  stretching: require('../assets/characters/lupe/stretching.webp'),
  shh: require('../assets/characters/lupe/shh.webp'),
  evilGrin: require('../assets/characters/lupe/evil-grin.webp'),
  chess: require('../assets/characters/lupe/chess.webp'),
  bow: require('../assets/characters/lupe/bow.webp'),
  bored: require('../assets/characters/lupe/bored.webp'),
  asleep: require('../assets/characters/lupe/asleep.webp'),
  fuming: require('../assets/characters/lupe/fuming.webp'),
  party: require('../assets/characters/lupe/party.webp'),
  impressed: require('../assets/characters/lupe/impressed.webp'),
  goodbye: require('../assets/characters/lupe/goodbye.webp'),
  frame: require('../assets/characters/lupe/frame.webp'),
  envelope: require('../assets/characters/lupe/envelope.webp'),
} satisfies Record<Pose, number>;

export const characters: Record<Roaster, Record<Pose, number>> = { loop, lupe };

export const loopSneakIn = require('../assets/characters/loop/sneak-in.webp');

export function pose(roaster: Roaster, p: Pose): number {
  return characters[roaster][p];
}

export const roasterName: Record<Roaster, string> = { loop: 'Loop', lupe: 'Lupe' };
