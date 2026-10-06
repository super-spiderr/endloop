import { EndloopCore } from "endloop-core";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import { pose, roasterName, type Pose } from "@/characters";
import { LimitSlider } from "@/components/limit-slider";
import {
  AppTile,
  Button,
  Character,
  LinkButton,
  Pill,
  Sheet,
  SpeechBubble,
  T,
} from "@/components/ui";
import { usage, type AppDetail, type RoastEntry } from "@/data/usage";
import { fmt, fmtLimit, suggestedLimit } from "@/lib/time";
import { factsFor } from "@/roasts/facts";
import { localDay, useSettings, type RoastLang } from "@/store/settings";
import { colors, fonts, radius, stateStyle, usageState } from "@/theme/tokens";

/** Screen 11 · App detail: one app up close, its limit (anti-cheat), and its Hall of shame. */
export default function AppDetailScreen() {
  const { pkg } = useLocalSearchParams<{ pkg: string }>();
  const {
    tracked,
    roaster,
    roastLang,
    intensity,
    changeLimit,
    scheduleRemove,
    cancelRemove,
  } = useSettings();
  const app = tracked.find((a) => a.packageName === pkg);

  const [today, setToday] = useState(0);
  const [detail, setDetail] = useState<AppDetail | null>(null);
  const [roasts, setRoasts] = useState<RoastEntry[]>([]);
  const [editing, setEditing] = useState(false);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    if (!pkg) return;
    const load = () => {
      usage.today([pkg]).then((t) => setToday(t[pkg] ?? 0));
      usage
        .detail(pkg)
        .then(setDetail)
        .catch(() => setDetail(null));
      setRoasts(usage.roasts(pkg).slice(0, 5));
    };
    load();
    const sub = AppState.addEventListener(
      "change",
      (s) => s === "active" && load(),
    );
    return () => sub.remove();
  }, [pkg]);

  if (!app) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bg, padding: 24, gap: 16 }}
      >
        <T v="title">Not tracking this app any more.</T>
        <Button label="Back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const state = usageState(today, app.limitMin);
  const ss = stateStyle[state];
  const heaviest = detail
    ? detail.parts.indexOf(Math.max(...detail.parts))
    : -1;
  const removing = !!app.removeFrom;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top"]}
    >
      <View style={st.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={st.back}
          hitSlop={6}
        >
          <BackIcon />
        </Pressable>
        <AppTile
          label={app.label}
          color={app.color}
          iconUri={app.iconUri}
          size={36}
        />
        <T v="bodyBold" style={{ flex: 1, fontSize: 20 }} numberOfLines={1}>
          {app.label}
        </T>
        <Pill text={ss.label} color={ss.color} bg={ss.tint} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Section title="Today">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            <Ring used={today} limit={app.limitMin} color={ss.color} />
            <View style={{ gap: 12 }}>
              <Stat
                big={String(detail?.opensToday ?? "–")}
                small="times opened"
              />
              <Stat
                big={detail ? `${detail.longestTodayMin} min` : "–"}
                small="longest session"
              />
              {today > app.limitMin ? (
                <T v="bodyBold" style={{ fontSize: 13, color: colors.red }}>
                  {fmt(today - app.limitMin)} over
                </T>
              ) : null}
            </View>
          </View>
          {today > app.limitMin ? (
            <SpeechBubble
              face={pose(roaster, "confiscate")}
              text={
                roastLang === "ta-Latn"
                  ? `Limit-a ${fmt(today - app.limitMin)} thaandiyaachu. Phone-a kudu.`
                  : `${fmt(today - app.limitMin)} past your limit. Hand it over.`
              }
            />
          ) : null}
        </Section>

        {detail ? (
          <Section title="This week">
            <WeekBars daily={detail.daily} limit={app.limitMin} />
            <WeekSummary daily={detail.daily} limit={app.limitMin} />
            {detail.daily.length >= 3 &&
            detail.daily.every((d) => d.minutes <= app.limitMin) ? (
              <SpeechBubble
                face={pose(roaster, "highFive")}
                text={
                  roastLang === "ta-Latn"
                    ? "Indha vaaram oru naal kooda limit thaandala. High five."
                    : "Not one day over this week. Up top."
                }
              />
            ) : null}
          </Section>
        ) : null}

        {detail && detail.parts.some((m) => m > 0) ? (
          <Section title="When you scroll the most">
            <View style={{ flexDirection: "row", gap: 6 }}>
              {PARTS.map((p, i) => {
                const on = i === heaviest;
                return (
                  <View
                    key={p.name}
                    style={[
                      st.part,
                      on && {
                        backgroundColor: colors.red,
                        borderColor: colors.red,
                      },
                    ]}
                  >
                    <T
                      v="bodyBold"
                      style={{
                        fontSize: 12,
                        lineHeight: 16,
                        color: on ? colors.white : colors.ink,
                      }}
                    >
                      {p.name}
                    </T>
                    <T
                      v="caption"
                      style={{
                        fontSize: 11,
                        lineHeight: 14,
                        color: on ? "rgba(255,255,255,0.85)" : colors.muted,
                      }}
                    >
                      {p.range}
                    </T>
                    <T
                      v="bodyBold"
                      style={{
                        fontSize: 15,
                        paddingTop: 4,
                        color: on ? colors.white : colors.ink,
                      }}
                    >
                      {fmt(detail.parts[i])}
                    </T>
                  </View>
                );
              })}
            </View>
            <SpeechBubble
              face={pose(roaster, PART_LINES[heaviest]?.pose ?? "peer")}
              text={PART_LINES[heaviest]?.[roastLang] ?? ""}
            />
          </Section>
        ) : null}

        <Section title="Limit">
          <View style={st.limitRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <T v="caption" style={{ fontFamily: fonts.bold }}>
                Daily limit
              </T>
              <T
                style={{
                  fontFamily: fonts.display,
                  fontSize: 24,
                  lineHeight: 28,
                  color: colors.ink,
                }}
              >
                {fmtLimit(app.limitMin)}
              </T>
              {app.nextLimitMin != null ? (
                <T
                  v="caption"
                  style={{ color: colors.heads, fontFamily: fonts.bold }}
                >
                  {fmtLimit(app.nextLimitMin)} from tomorrow
                </T>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setEditing(true)}
              style={st.edit}
            >
              <T v="bodyBold" style={{ fontSize: 15, color: colors.red }}>
                Edit
              </T>
            </Pressable>
          </View>
        </Section>

        <Section title="Try this">
          <View style={st.tip}>
            <T v="label" style={{ fontSize: 11, color: colors.heads }}>
              Try this
            </T>
            <T v="bodyBold" style={{ fontSize: 15, lineHeight: 21 }}>
              {tipFor(heaviest, app.label, roastLang, intensity)}
            </T>
          </View>
        </Section>

        {roasts.length ? (
          <Section title="Hall of shame">
            <View style={{ gap: 8 }}>
              {roasts.map((r) => (
                <View key={r.at} style={st.shame}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <T
                      v="bodyBold"
                      style={{
                        fontSize: 12,
                        lineHeight: 16,
                        color: colors.red,
                      }}
                    >
                      {when(r.at)}
                    </T>
                    <T
                      style={{
                        fontFamily: fonts.display,
                        fontSize: 15,
                        lineHeight: 20,
                        color: colors.ink,
                      }}
                    >
                      {r.text}
                    </T>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Share this roast"
                    onPress={() =>
                      EndloopCore?.shareRoast(
                        r.text,
                        `${app.label} · ${when(r.at)}`,
                      )
                    }
                    style={st.share}
                  >
                    <ShareIcon />
                  </Pressable>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        <View style={{ alignItems: "center", paddingTop: 26 }}>
          {removing ? (
            <View style={{ alignItems: "center", gap: 6 }}>
              <T v="caption">Stops tracking tomorrow.</T>
              <LinkButton
                label="Keep tracking"
                color={colors.red}
                onPress={() => cancelRemove(app.packageName)}
              />
            </View>
          ) : (
            <LinkButton
              label={`Stop tracking ${app.label}`}
              onPress={() => setStopping(true)}
            />
          )}
        </View>
      </ScrollView>

      {editing ? (
        <EditLimit
          visible
          onClose={() => setEditing(false)}
          label={app.label}
          current={app.limitMin}
          average={app.avgDailyMin}
          roasterFace={(p: Pose) => pose(roaster, p)}
          onSave={(m) => {
            changeLimit(app.packageName, m);
            setEditing(false);
          }}
        />
      ) : null}

      <Sheet visible={stopping} onClose={() => setStopping(false)}>
        <View style={{ alignItems: "center" }}>
          <Character
            source={pose(roaster, "yourCall")}
            size={150}
            alt={`${roasterName[roaster]}, hands up: your call`}
          />
        </View>
        <T v="display" style={{ fontSize: 28, lineHeight: 31 }}>
          Stop tracking {app.label}?
        </T>
        <T>
          I&apos;ll stop watching it from tomorrow. Today, the limit stays. Nice
          try.
        </T>
        <Button label="Keep tracking" onPress={() => setStopping(false)} />
        <LinkButton
          label="Stop from tomorrow"
          onPress={() => {
            scheduleRemove(app.packageName);
            setStopping(false);
          }}
        />
      </Sheet>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------

const PARTS = [
  { name: "Morning", range: "6–12" },
  { name: "Afternoon", range: "12–5" },
  { name: "Evening", range: "5–10" },
  { name: "Late night", range: "10–6" },
];

const PART_LINES: ({ pose: Pose } & Record<RoastLang, string>)[] = [
  {
    pose: "coffee",
    en: "Mornings. You open your eyes, then this. In that order, hopefully.",
    "ta-Latn": "Kaalaila kannu open, udane idhu. Adhu order-a irundha sari.",
  },
  {
    pose: "deskSlump",
    en: "Afternoons. The post-lunch scroll is real, and it is winning.",
    "ta-Latn": "Madhiyam lunch-ku apram scroll. Adhu dhaan jeyikkudhu.",
  },
  {
    pose: "couch",
    en: "Evenings. The hours you said were for you.",
    "ta-Latn": "Saayangaalam. Unakkaaga-nu sonna neram idhu dhaan.",
  },
  {
    pose: "yawning",
    en: "Late nights. Every night. We need to talk.",
    "ta-Latn": "Raathiri late. Daily. Naama pesanum.",
  },
];

/** A tip that fits the pattern (late night → keep the phone out of the bedroom), else one from the tips list. */
function tipFor(
  heaviest: number,
  label: string,
  lang: RoastLang,
  intensity: "polite" | "honest" | "savage",
): string {
  if (heaviest === 3) {
    return lang === "ta-Latn"
      ? `Phone-a bedroom-ku veliya charge pannunga. Unga ${label} time-la perusu raathiri dhaan.`
      : `Charge your phone outside the bedroom. Late night is where most of your ${label} goes.`;
  }
  const tips = factsFor(lang, intensity).filter((f) => f.source === "Tip");
  return tips[new Date().getDate() % tips.length]?.text ?? "";
}

function when(at: number): string {
  const d = new Date(at);
  const today = localDay();
  const day = localDay(-1);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const time = d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (key === today) return `Today · ${time}`;
  if (key === day) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString("en-IN", { weekday: "short" })} · ${time}`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 18, gap: 12 }}>
      <T v="label" accessibilityRole="header">
        {title}
      </T>
      {children}
    </View>
  );
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <View style={{ gap: 2 }}>
      <T
        style={{
          fontFamily: fonts.display,
          fontSize: 22,
          lineHeight: 26,
          color: colors.ink,
        }}
      >
        {big}
      </T>
      <T v="caption">{small}</T>
    </View>
  );
}

function Ring({
  used,
  limit,
  color,
}: {
  used: number;
  limit: number;
  color: string;
}) {
  const R = 58;
  const c = 2 * Math.PI * R;
  const pct = Math.min(1, limit > 0 ? used / limit : 0);
  return (
    <View
      style={{ width: 140, height: 140 }}
      accessible
      accessibilityLabel={`${fmt(used)} of ${fmt(limit)} today`}
    >
      <Svg width={140} height={140} viewBox="0 0 140 140">
        <Circle
          cx={70}
          cy={70}
          r={R}
          stroke={colors.line}
          strokeWidth={12}
          fill="none"
        />
        <Circle
          cx={70}
          cy={70}
          r={R}
          stroke={color}
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 70 70)"
        />
      </Svg>
      <View
        style={[
          StyleSheet.absoluteFill,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <T
          style={{
            fontFamily: fonts.display,
            fontSize: 26,
            lineHeight: 30,
            color: colors.ink,
          }}
        >
          {fmt(used)}
        </T>
        <T v="caption" style={{ fontSize: 12 }}>
          of {fmt(limit)}
        </T>
      </View>
    </View>
  );
}

const BAR_H = 120;

function WeekBars({
  daily,
  limit,
}: {
  daily: AppDetail["daily"];
  limit: number;
}) {
  const top = Math.max(limit, ...daily.map((d) => d.minutes), 1) * 1.1;
  const lineY = BAR_H - (limit / top) * BAR_H;
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      <View pointerEvents="none" style={[st.limitLine, { top: lineY }]} />
      <T v="caption" style={[st.limitTag, { top: lineY - 18 }]}>
        Limit {fmtLimit(limit)}
      </T>
      {daily.map((d, i) => {
        const isToday = i === daily.length - 1;
        const over = d.minutes > limit;
        const col = over ? colors.red : isToday ? colors.chill : "#E3C4C8";
        const label = isToday
          ? "Today"
          : new Date(d.day).toLocaleDateString("en-IN", { weekday: "short" });
        return (
          <View
            key={d.day}
            style={{ flex: 1, alignItems: "center", gap: 6 }}
            accessible
            accessibilityLabel={`${label}: ${fmt(d.minutes)}${over ? ", over the limit" : ""}`}
          >
            <View
              style={{
                height: BAR_H,
                width: "100%",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 22,
                  height: Math.max(2, (d.minutes / top) * BAR_H),
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                  borderRadius: 3,
                  backgroundColor: col,
                }}
              />
            </View>
            <T
              v="caption"
              style={{
                fontSize: 12,
                color: isToday ? colors.ink : colors.muted,
                fontFamily: isToday ? fonts.bold : fonts.medium,
              }}
            >
              {label}
            </T>
          </View>
        );
      })}
    </View>
  );
}

function WeekSummary({
  daily,
  limit,
}: {
  daily: AppDetail["daily"];
  limit: number;
}) {
  const avg = Math.round(
    daily.reduce((s, d) => s + d.minutes, 0) / Math.max(1, daily.length),
  );
  const over = daily.filter((d) => d.minutes > limit).length;
  return (
    <T style={{ fontSize: 14, color: colors.ink }}>
      Average{" "}
      <T v="bodyBold" style={{ fontSize: 14 }}>
        {fmt(avg)}
      </T>{" "}
      a day ·{" "}
      <T
        v="bodyBold"
        style={{ fontSize: 14, color: over ? colors.red : colors.chill }}
      >
        {over} of {daily.length}
      </T>{" "}
      days over
    </T>
  );
}

/** Edit limit (same slider as Screen 5). Lower = now; higher = from tomorrow. */
function EditLimit({
  visible,
  onClose,
  label,
  current,
  average,
  roasterFace,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  label: string;
  current: number;
  average: number;
  roasterFace: (p: Pose) => number;
  onSave: (min: number) => void;
}) {
  // mounted fresh each time the sheet opens, so it starts from the current limit
  const [value, setValue] = useState(current);
  const lower = value <= current;
  const same = value === current;
  return (
    <Sheet visible={visible} onClose={onClose}>
      <T v="label">{label} daily limit</T>
      <T
        style={{
          fontFamily: fonts.display,
          fontSize: 44,
          lineHeight: 48,
          color: colors.ink,
        }}
      >
        {fmtLimit(value)}
      </T>
      <LimitSlider
        value={value}
        average={average >= 5 ? average : null}
        label={`${label} daily limit`}
        onChange={setValue}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[
          { l: "Suggested", v: suggestedLimit(average) },
          { l: "30 min", v: 30 },
          { l: "1 hour", v: 60 },
        ].map((c) => (
          <Pressable
            key={c.l}
            accessibilityRole="button"
            onPress={() => setValue(c.v)}
            style={[
              st.chip,
              value === c.v && {
                backgroundColor: colors.red,
                borderColor: colors.red,
              },
            ]}
          >
            <T
              v="bodyBold"
              style={{
                fontSize: 13,
                color: value === c.v ? colors.white : colors.ink,
              }}
            >
              {c.l}
            </T>
          </Pressable>
        ))}
      </View>
      {same ? null : (
        <>
          <T
            v="bodyBold"
            style={{ fontSize: 14, color: lower ? colors.chill : colors.heads }}
          >
            {lower
              ? "Lower limit · starts right now"
              : "Higher limit · starts tomorrow"}
          </T>
          <SpeechBubble
            face={roasterFace(lower ? "thumbsUp" : "calendar")}
            text={
              lower ? "Look at you." : "Raising it? Fine. Starting tomorrow."
            }
          />
        </>
      )}
      <Button
        label={same || lower ? "Save" : "Save for tomorrow"}
        disabled={same}
        onPress={() => onSave(value)}
      />
    </Sheet>
  );
}

function BackIcon() {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={colors.ink}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M15 5l-7 7 7 7" />
    </Svg>
  );
}

function ShareIcon() {
  return (
    <Svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={colors.muted}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </Svg>
  );
}

const st = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 16,
    paddingLeft: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  part: {
    flex: 1,
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  limitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  edit: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.red,
    justifyContent: "center",
  },
  tip: {
    gap: 4,
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.headsTint,
    borderWidth: 1,
    borderColor: "#F3D9B0",
  },
  shame: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  share: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    justifyContent: "center",
  },
  limitLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.ink,
    opacity: 0.35,
    zIndex: 1,
  },
  limitTag: {
    position: "absolute",
    right: 0,
    fontSize: 11,
    fontFamily: fonts.bold,
    zIndex: 1,
  },
});
