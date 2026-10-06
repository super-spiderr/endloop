/**
 * What kind of app a tracked app is, so a roast fits it: no "feed" or "reels" lines for Messages.
 * Roast lines carry `kinds` (design/tools/roasts/build.py); lines without it fit any app.
 * Order: known package → keywords in the package name / label → 'other' (universal lines only).
 */
export type AppKind = 'feed' | 'video' | 'chat' | 'browser' | 'games' | 'shopping' | 'work' | 'other';

const KNOWN: Record<string, AppKind> = {
  // feeds
  'com.instagram.android': 'feed',
  'com.instagram.barcelona': 'feed', // Threads
  'com.facebook.katana': 'feed',
  'com.facebook.lite': 'feed',
  'com.snapchat.android': 'feed',
  'com.twitter.android': 'feed',
  'com.reddit.frontpage': 'feed',
  'com.pinterest': 'feed',
  'com.linkedin.android': 'feed',
  'com.zhiliaoapp.musically': 'feed',
  'in.mohalla.sharechat': 'feed',
  'in.mohalla.video': 'feed', // Moj
  'com.eterno.shortvideos': 'feed', // Josh
  'com.quora.android': 'feed',
  'com.tumblr': 'feed',
  // video
  'com.google.android.youtube': 'video',
  'com.netflix.mediaclient': 'video',
  'com.amazon.avod.thirdpartyclient': 'video',
  'in.startv.hotstar': 'video',
  'com.jio.media.ondemand': 'video',
  'com.graymatrix.did': 'video',
  'com.sonyliv': 'video',
  'com.mxtech.videoplayer.ad': 'video',
  'tv.twitch.android.app': 'video',
  // chat
  'com.whatsapp': 'chat',
  'com.whatsapp.w4b': 'chat',
  'org.telegram.messenger': 'chat',
  'com.google.android.apps.messaging': 'chat',
  'com.samsung.android.messaging': 'chat',
  'com.android.mms': 'chat',
  'org.thoughtcrime.securesms': 'chat',
  'com.facebook.orca': 'chat',
  'com.discord': 'chat',
  // browsers
  'com.android.chrome': 'browser',
  'org.mozilla.firefox': 'browser',
  'com.sec.android.app.sbrowser': 'browser',
  'com.brave.browser': 'browser',
  'com.microsoft.emmx': 'browser',
  'com.opera.browser': 'browser',
  'com.opera.mini.native': 'browser',
  'com.duckduckgo.mobile.android': 'browser',
  // work
  'com.google.android.gm': 'work',
  'com.microsoft.office.outlook': 'work',
  'com.Slack': 'work',
  'com.microsoft.teams': 'work',
  // shopping and ordering
  'in.amazon.mShop.android.shopping': 'shopping',
  'com.flipkart.android': 'shopping',
  'com.myntra.android': 'shopping',
  'com.meesho.supply': 'shopping',
  'com.ril.ajio': 'shopping',
  'com.application.zomato': 'shopping',
  'in.swiggy.android': 'shopping',
  'com.zeptoconsumerapp': 'shopping',
  'com.grofers.customerapp': 'shopping',
  'com.fsn.nykaa': 'shopping',
  // games
  'com.pubg.imobile': 'games',
  'com.tencent.ig': 'games',
  'com.dts.freefireth': 'games',
  'com.dts.freefiremax': 'games',
  'com.ludo.king': 'games',
  'com.king.candycrushsaga': 'games',
  'com.supercell.clashofclans': 'games',
  'com.supercell.clashroyale': 'games',
};

const KEYWORDS: [RegExp, AppKind][] = [
  [/messag|\bsms\b|\.mms|chat|messenger|telegram|signal/i, 'chat'],
  [/browser|chrome|firefox|opera|\bbrave\b/i, 'browser'],
  [/\bmail|gmail|outlook|slack|teams/i, 'work'],
  [/shop|cart|store\.app|grocer|food/i, 'shopping'],
  [/game|games|play\.|ludo|chess|puzzle|battle|craft/i, 'games'],
  [/video|movie|\btv\b|stream|player|netflix|prime/i, 'video'],
  [/social|feed|reels|shorts|photo/i, 'feed'],
];

export function appKind(packageName: string, label = ''): AppKind {
  if (!packageName) return 'other';
  const known = KNOWN[packageName];
  if (known) return known;
  const hay = `${packageName} ${label}`;
  for (const [re, kind] of KEYWORDS) if (re.test(hay)) return kind;
  return 'other';
}
