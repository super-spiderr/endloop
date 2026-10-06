/**
 * Screen 17 · App icon matches your roaster.
 *
 * Android can't swap an app's icon directly, so the launcher entry moves from
 * MainActivity to three <activity-alias> entries (default, Loop, Lupe) and the
 * native module turns exactly one of them on. The icon art lives in
 * modules/endloop-core/android/src/main/res (ic_endloop_loop / ic_endloop_lupe).
 */
const { withAndroidManifest } = require('expo/config-plugins');

const ICONS = [
  { name: '.IconDefault', icon: '@mipmap/ic_launcher', round: '@mipmap/ic_launcher_round', enabled: true },
  { name: '.IconLoop', icon: '@mipmap/ic_endloop_loop', round: '@mipmap/ic_endloop_loop', enabled: false },
  { name: '.IconLupe', icon: '@mipmap/ic_endloop_lupe', round: '@mipmap/ic_endloop_lupe', enabled: false },
];

const isLauncher = (f) =>
  f.action?.some((a) => a.$['android:name'] === 'android.intent.action.MAIN') &&
  f.category?.some((c) => c.$['android:name'] === 'android.intent.category.LAUNCHER');

module.exports = function withAppIcons(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;

    const main = app.activity?.find((a) => a.$['android:name'] === '.MainActivity');
    if (!main) throw new Error('with-app-icons: .MainActivity not found');

    // MainActivity keeps its deep-link filters but is no longer a launcher entry itself.
    main['intent-filter'] = (main['intent-filter'] ?? []).filter((f) => !isLauncher(f));

    const others = (app['activity-alias'] ?? []).filter((a) => !ICONS.some((i) => i.name === a.$['android:name']));
    app['activity-alias'] = [
      ...others,
      ...ICONS.map((i) => ({
        $: {
          'android:name': i.name,
          'android:enabled': String(i.enabled),
          'android:exported': 'true',
          'android:icon': i.icon,
          'android:roundIcon': i.round,
          'android:label': '@string/app_name',
          'android:targetActivity': '.MainActivity',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
            category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
          },
        ],
      })),
    ];
    return cfg;
  });
};
