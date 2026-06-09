/**
 * UTM → sub4 source mapping for the Winline promo link.
 *
 * Priority (highest to lowest):
 *   1. utm_term  (vk1..vk10, rsya1..rsya15)
 *   2. utm_source + utm_medium + utm_campaign
 *   3. utm_source + utm_medium
 *   4. utm_source
 */

/* ─── Term-based lookup (VK, РСЯ) ───────────────────────────────────────── */
const TERM_MAP: Record<string, string> = {
  // VK Ads
  vk1: 'source_1',
  vk2: 'source_2',
  vk3: 'source_3',
  vk4: 'source_4',
  vk5: 'source_5',
  vk6: 'source_6',
  vk7: 'source_7',
  vk8: 'source_8',
  vk9: 'source_9',
  vk10: 'source_10',
  // РСЯ
  rsya1: 'source_21',
  rsya2: 'source_22',
  rsya3: 'source_23',
  rsya4: 'source_24',
  rsya5: 'source_25',
  rsya6: 'source_26',
  rsya7: 'source_27',
  rsya8: 'source_28',
  rsya9: 'source_29',
  rsya10: 'source_30',
  rsya11: 'source_31',
  rsya12: 'source_32',
  rsya13: 'source_33',
  rsya14: 'source_34',
  rsya15: 'source_35',
}

/* ─── source|medium|campaign lookup ─────────────────────────────────────── */
const CAMPAIGN_MAP: Record<string, string> = {
  // Sport24 — Виджеты
  'sport24|slayder|vidjet1': 'source_11',
  'sport24|slayder|vidjet2': 'source_12',
  'sport24|slayder|vidjet3': 'source_13',
  'sport24|slayder|vidjet4': 'source_14',
  'sport24|slayder|vidjet5': 'source_15',
  'sport24|slayder|vidjet6': 'source_16',
  'sport24|slayder|vidjet7': 'source_17',
  'sport24|slayder|vidjet8': 'source_18',
  'sport24|slayder|vidjet9': 'source_19',
  'sport24|slayder|vidjet10': 'source_20',
  // Sport24 — Медийка
  'sport24|media|undefoto': 'source_36',
  'sport24|media|240x400': 'source_37',
  'sport24|media|dinread': 'source_38',
  'sport24|media|minread': 'source_39',
  'sport24|media|bottomline': 'source_40',
  'sport24|media|gift': 'source_41',
  'sport24|media|promobutton': 'source_42',
  'sport24|media|informer': 'source_43',
  'sport24|media|fullscreen': 'source_44',
  'sport24|media|site9': 'source_45',
  'sport24|media|site10': 'source_46',
  'sport24|media|site11': 'source_47',
  'sport24|media|site12': 'source_48',
  'sport24|media|site13': 'source_49',
  'sport24|media|site14': 'source_50',
  'sport24|media|site15': 'source_51',
  'sport24|media|site16': 'source_52',
  'sport24|media|site17': 'source_53',
  'sport24|media|site18': 'source_54',
  'sport24|media|site19': 'source_55',
  'sport24|media|site20': 'source_56',
  // Блогеры
  'blogger|social|blogger1': 'source_57',
  'blogger|social|blogger2': 'source_58',
  'blogger|social|blogger3': 'source_59',
  'blogger|social|blogger4': 'source_60',
  'blogger|social|blogger5': 'source_61',
  'blogger|social|blogger6': 'source_62',
  'blogger|social|blogger7': 'source_63',
  'blogger|social|blogger8': 'source_64',
  'blogger|social|blogger9': 'source_65',
  'blogger|social|blogger10': 'source_66',
  'blogger|social|blogger11': 'source_67',
  'blogger|social|blogger12': 'source_68',
  'blogger|social|blogger13': 'source_69',
  'blogger|social|blogger14': 'source_70',
  'blogger|social|blogger15': 'source_71',
  'blogger|social|blogger16': 'source_72',
  'blogger|social|blogger17': 'source_73',
  'blogger|social|blogger18': 'source_74',
  'blogger|social|blogger19': 'source_75',
  'blogger|social|blogger20': 'source_76',
  // Sport24 — Статьи / новости
  'sport24|link|statya1': 'source_81',
  'sport24|link|statya2': 'source_82',
  'sport24|link|statya3': 'source_83',
  'sport24|link|statya4': 'source_84',
  'sport24|link|statya5': 'source_85',
  'sport24|link|statya6': 'source_86',
  'sport24|link|statya7': 'source_87',
  'sport24|link|statya8': 'source_88',
  'sport24|link|statya9': 'source_89',
  'sport24|link|statya10': 'source_90',
  // Gnezdo
  'gnezdo|cpc|memocup': 'source_91',
  // Жираф
  'giraff|cpc|memocup': 'source_92',
  // SberAds
  'sberads|promo|sberads1': 'source_93',
  'sberads|promo|sberads2': 'source_94',
  'sberads|promo|sberads3': 'source_95',
  'sberads|promo|sberads4': 'source_96',
  'sberads|promo|sberads5': 'source_97',
}

/* ─── source|medium lookup (youtube) ────────────────────────────────────── */
const SOURCE_MEDIUM_MAP: Record<string, string> = {
  'youtube|video': 'source_79',
  'youtube|community': 'source_80',
}

/* ─── source-only lookup ─────────────────────────────────────────────────── */
const SOURCE_MAP: Record<string, string> = {
  pikabu: 'source_77',
  social: 'source_78',
}

/**
 * Reads UTM params from the current URL and returns the matching sub4 value.
 * Returns empty string if no match found.
 */
export function getSourceFromUTM(): string {
  const p = new URLSearchParams(window.location.search)

  const term = (p.get('utm_term') ?? '').toLowerCase()
  const source = (p.get('utm_source') ?? '').toLowerCase()
  const medium = (p.get('utm_medium') ?? '').toLowerCase()
  // Keep campaign case-insensitive for Site9..Site20 variants
  const campaign = (p.get('utm_campaign') ?? '').toLowerCase()

  // 1. utm_term
  if (term && TERM_MAP[term]) return TERM_MAP[term]

  // 2. source|medium|campaign
  const smcKey = `${source}|${medium}|${campaign}`
  if (CAMPAIGN_MAP[smcKey]) return CAMPAIGN_MAP[smcKey]

  // 3. source|medium
  const smKey = `${source}|${medium}`
  if (SOURCE_MEDIUM_MAP[smKey]) return SOURCE_MEDIUM_MAP[smKey]

  // 4. source-only
  if (source && SOURCE_MAP[source]) return SOURCE_MAP[source]

  return ''
}
