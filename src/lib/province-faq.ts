// Copyright (c) 2026 Will Reynolds
// SPDX-License-Identifier: MIT
/**
 * Province FAQ generator — derives 4 templated Q-A pairs from the province
 * record + locale + the all-77 array (for regional comparisons).
 *
 * Why templated: 154 Q-A blocks (77 provinces × 2 locales) ship in one
 * ticket. The numbers differ per province so each page's prose is unique
 * and citable — AI search lifts the answer with the province name + score
 * inline. Hand-authored marquee overrides can land later via a per-province
 * map; not P1.
 *
 * The four questions match the strategy doc:
 *   1. What is {Province}'s liveability score?           → composite + rank
 *   2. Which categories does {Province} score highest in?→ top 3
 *   3. Which categories does {Province} score lowest in? → bottom 3
 *   4. How does {Province} compare to other provinces in {Region}?
 *      (floored variant: "Why is {Province}'s liveability score 0?")
 *
 * Returns FaqEntry[] for the visual render and a `FAQPage` JSON-LD payload
 * for the schema script tag — the same Q-A content in both surfaces so AI
 * search engines and humans see identical text.
 */
import { categoryLabel, regionLabel } from '../data/lookups';
import type { Province, Locale } from '../data/types';

export interface FaqEntry {
  question: string;
  answer: string;
}

interface FaqResult {
  entries: FaqEntry[];
  jsonLd: {
    '@context': string;
    '@type': 'FAQPage';
    mainEntity: Array<{
      '@type': 'Question';
      name: string;
      acceptedAnswer: { '@type': 'Answer'; text: string };
    }>;
  };
}

function freshestAsOf(p: Province): string {
  let freshest = '';
  for (const cat of Object.values(p.categories)) {
    if (cat.freshest_as_of && cat.freshest_as_of > freshest) freshest = cat.freshest_as_of;
  }
  return freshest;
}

function joinList(items: string[], locale: Locale): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return locale === 'th' ? `${items[0]} และ ${items[1]}` : `${items[0]} and ${items[1]}`;
  const head = items.slice(0, -1).join(locale === 'th' ? ' ' : ', ');
  const tail = items[items.length - 1];
  return locale === 'th' ? `${head} และ ${tail}` : `${head}, and ${tail}`;
}

export function provinceFaqEntries(
  province: Province,
  locale: Locale,
  allProvinces: Province[],
): FaqResult {
  const name = locale === 'th' ? province.name_th : province.name_en;
  const region = regionLabel(province.region, locale);
  const composite = province.floored ? 0 : Math.round(province.composite ?? 0);
  const asOf = freshestAsOf(province);

  // Sort categories by score descending. Floored provinces still have real
  // category scores in the underlying data; only the composite is zeroed.
  const cats = Object.values(province.categories)
    .map((c) => ({ id: c.id, label: categoryLabel(c.id, locale), score: Math.round(c.score) }))
    .sort((a, b) => b.score - a.score);
  const top3 = cats.slice(0, 3);
  const bottom3 = cats.slice(-3).reverse(); // worst first

  // Regional context — rank within region, leader, laggard.
  const regionPeers = allProvinces.filter((p) => p.region === province.region);
  const regionRanked = [...regionPeers].sort((a, b) => {
    const sa = a.floored ? -1 : (a.composite ?? -1);
    const sb = b.floored ? -1 : (b.composite ?? -1);
    return sb - sa;
  });
  const regionRank = regionRanked.findIndex((p) => p.id === province.id) + 1;
  const regionLeader = regionRanked[0];
  const regionLaggard = regionRanked[regionRanked.length - 1];
  const regionLeaderName = locale === 'th' ? regionLeader.name_th : regionLeader.name_en;
  const regionLaggardName = locale === 'th' ? regionLaggard.name_th : regionLaggard.name_en;
  const regionLeaderScore = regionLeader.floored ? 0 : Math.round(regionLeader.composite ?? 0);
  const regionLaggardScore = regionLaggard.floored ? 0 : Math.round(regionLaggard.composite ?? 0);

  // Floored category lookup — used in Q4 fallback.
  const flooredCategoryLabel = province.floored && province.floored_by
    ? categoryLabel(province.floored_by, locale)
    : null;

  // Q1: composite + rank + methodology one-liner.
  const q1: FaqEntry = locale === 'th'
    ? {
        question: `คะแนนคุณภาพการอยู่อาศัยของ${name}คือเท่าไร?`,
        answer: `${name}ได้คะแนน ${composite} จาก 100 บน Thailand Liveability Index อันดับ ${province.rank} จาก 77 จังหวัดของไทย${asOf ? ` (ข้อมูล ณ ${asOf})` : ''} คะแนนนี้รวม 25 ตัวชี้วัดจาก 7 หมวดด้วยค่าเฉลี่ยเรขาคณิต ดังนั้นหมวดที่อ่อนจะไม่ถูกหมวดที่แข็งกลบ`,
      }
    : {
        question: `What is ${name}'s liveability score?`,
        answer: `${name} scores ${composite} of 100 on the Thailand Liveability Index, ranking ${province.rank} of 77 Thai provinces${asOf ? ` (data as of ${asOf})` : ''}. The score combines 25 indicators across seven categories using a geometric mean, so weak categories are not masked by strong ones.`,
      };

  // Q2: top 3 categories.
  const top3List = joinList(
    top3.map((c) => locale === 'th' ? `${c.label} (${c.score}/100)` : `${c.label} (${c.score}/100)`),
    locale,
  );
  const q2: FaqEntry = locale === 'th'
    ? {
        question: `${name}ได้คะแนนสูงในหมวดใดบ้าง?`,
        answer: `${name}ได้คะแนนสูงสุดในสามหมวดนี้: ${top3List} ทั้งสามหมวดนี้ดึงคะแนนรวมของ${name}ขึ้นเหนือค่ามัธยฐานของจังหวัดไทย`,
      }
    : {
        question: `Which categories does ${name} score highest in?`,
        answer: `${name}'s top three categories on the Thailand Liveability Index are ${top3List}. These categories pull ${name}'s composite above the median for Thai provinces.`,
      };

  // Q3: bottom 3 categories.
  const bot3List = joinList(
    bottom3.map((c) => locale === 'th' ? `${c.label} (${c.score}/100)` : `${c.label} (${c.score}/100)`),
    locale,
  );
  const q3: FaqEntry = locale === 'th'
    ? {
        question: `${name}ได้คะแนนต่ำในหมวดใดบ้าง?`,
        answer: `${name}ได้คะแนนต่ำสุดในสามหมวดนี้: ${bot3List} เนื่องจากค่าเฉลี่ยเรขาคณิตให้น้ำหนักหมวดที่อ่อนมาก หมวดเหล่านี้จึงเป็นจุดที่ดึงคะแนนรวมของ${name}ลงมากที่สุด`,
      }
    : {
        question: `Which categories does ${name} score lowest in?`,
        answer: `${name}'s lowest three categories are ${bot3List}. Because the Thailand Liveability Index uses a geometric mean — which penalises weak categories more heavily than a simple average — these are the categories pulling ${name}'s composite down the most.`,
      };

  // Q4: regional comparison (or floored explanation).
  // Non-floored answer explains *why* the province lands where it does in
  // its region by naming the category with the largest gap to the regional
  // leader (or, for regional leaders, the category with the largest gap to
  // the regional average). AI-search citations want the reason, not just
  // the rank.
  let q4: FaqEntry;
  if (province.floored && flooredCategoryLabel) {
    q4 = locale === 'th'
      ? {
          question: `ทำไมคะแนนคุณภาพการอยู่อาศัยของ${name}เป็น 0?`,
          answer: `${name}ติดเพดานที่คะแนนรวม 0 เพราะคะแนนหมวด${flooredCategoryLabel}แตะระดับ 0 Thailand Liveability Index ใช้ค่าเฉลี่ยเรขาคณิต ดังนั้นจังหวัดที่ได้ 0 ในหมวดใดหมวดหนึ่งจะติดเพดานคะแนนรวมที่ 0 ตามหลักไม่ทดแทนกัน คุณค่าจริงของหมวดอื่นยังแสดงอยู่ด้านบนอย่างซื่อสัตย์`,
        }
      : {
          question: `Why is ${name}'s liveability score 0?`,
          answer: `${name}'s composite floors at 0 because its ${flooredCategoryLabel.toLowerCase()} category reaches 0. The Thailand Liveability Index uses a geometric mean, so any province scoring 0 in any single category is honestly floored at 0 overall under the non-substitutability principle. The remaining six categories still carry their real values above and are not hidden by the flooring.`,
        };
  } else {
    // Compute the explanatory category gap.
    const provCatScores: Record<string, number> = {};
    for (const c of Object.values(province.categories)) {
      provCatScores[c.id] = c.score;
    }
    let explanation = '';
    if (regionRank === 1) {
      // This province IS the regional leader — find biggest positive gap
      // vs. the regional average score in any one category.
      const regionAvgByCategory: Record<string, number> = {};
      for (const cid of Object.keys(province.categories)) {
        const sum = regionPeers.reduce((acc, p) => acc + (p.categories[cid as keyof typeof p.categories]?.score ?? 0), 0);
        regionAvgByCategory[cid] = sum / regionPeers.length;
      }
      const ranked = Object.values(province.categories)
        .map((c) => ({
          id: c.id,
          label: categoryLabel(c.id, locale),
          provScore: Math.round(c.score),
          regionAvg: Math.round(regionAvgByCategory[c.id]),
          gap: c.score - regionAvgByCategory[c.id],
        }))
        .sort((a, b) => b.gap - a.gap);
      const topGap = ranked[0];
      explanation = locale === 'th'
        ? `${name}เป็นจังหวัดอันดับหนึ่งของ${region} หมวดที่${name}แซงค่าเฉลี่ยภูมิภาคมากที่สุดคือ${topGap.label} (${topGap.provScore}/100 เทียบกับค่าเฉลี่ยภูมิภาค ${topGap.regionAvg}/100)`
        : `${name} leads its region. The category where ${name} most outperforms the ${region} average is ${topGap.label} (${topGap.provScore}/100, compared to the regional average of ${topGap.regionAvg}/100).`;
    } else {
      // Find biggest negative gap with the regional leader.
      const ranked = Object.values(province.categories)
        .map((c) => {
          const leaderCat = regionLeader.categories[c.id as keyof typeof regionLeader.categories];
          const leaderScore = leaderCat ? leaderCat.score : 0;
          return {
            id: c.id,
            label: categoryLabel(c.id, locale),
            provScore: Math.round(c.score),
            leaderScore: Math.round(leaderScore),
            gap: leaderScore - c.score,
          };
        })
        .sort((a, b) => b.gap - a.gap);
      const biggest = ranked[0];
      if (biggest.gap > 0) {
        explanation = locale === 'th'
          ? `จุดที่${name}ห่างจาก${regionLeaderName}มากที่สุดคือหมวด${biggest.label} (${biggest.provScore}/100 เทียบกับ${regionLeaderName} ${biggest.leaderScore}/100 ห่าง ${Math.round(biggest.gap)} คะแนน) ค่าเฉลี่ยเรขาคณิตของ TLI ลงโทษช่องว่างขนาดนี้ในการรวมคะแนน`
          : `${name}'s biggest gap behind ${regionLeaderName} is in ${biggest.label} (${biggest.provScore}/100 vs. ${regionLeaderName}'s ${biggest.leaderScore}/100, a ${Math.round(biggest.gap)}-point spread). The TLI geometric-mean composite penalises gaps of this size when combining the seven category scores.`;
      }
    }

    const factualLine = locale === 'th'
      ? `ใน${region} ${regionPeers.length} จังหวัด ${name}อยู่อันดับ ${regionRank} ตามคะแนน Thailand Liveability Index จังหวัดที่คะแนนสูงสุดในภูมิภาคคือ${regionLeaderName} (${regionLeaderScore}/100) ส่วนจังหวัดที่คะแนนต่ำสุดคือ${regionLaggardName} (${regionLaggardScore}/100)`
      : `Among ${region}'s ${regionPeers.length} Thai provinces, ${name} ranks ${regionRank} on the Thailand Liveability Index. The strongest ${region} province is ${regionLeaderName} (${regionLeaderScore}/100); the weakest is ${regionLaggardName} (${regionLaggardScore}/100).`;

    q4 = locale === 'th'
      ? {
          question: `${name}เทียบกับจังหวัดอื่นในภูมิภาค${region}อย่างไร?`,
          answer: explanation ? `${factualLine} ${explanation}` : factualLine,
        }
      : {
          question: `How does ${name} compare to other provinces in ${region}?`,
          answer: explanation ? `${factualLine} ${explanation}` : factualLine,
        };
  }

  const entries = [q1, q2, q3, q4];

  // FAQPage JSON-LD — same content as the visual render.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage' as const,
    mainEntity: entries.map((e) => ({
      '@type': 'Question' as const,
      name: e.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: e.answer,
      },
    })),
  };

  return { entries, jsonLd };
}
