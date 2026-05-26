const TAG_RULES: Array<{ tag: string; keywords: string[] }> = [
  {
    tag: 'Theology',
    keywords: ['trinity', 'salvation', 'grace', 'theology', 'holy spirit', 'sin', 'redemption', 'righteousness', 'justification', 'sanctification', 'atonement', 'incarnation'],
  },
  {
    tag: 'Old Testament',
    keywords: ['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges', 'samuel', 'kings', 'chronicles', 'psalms', 'proverbs', 'isaiah', 'jeremiah', 'ezekiel', 'daniel', 'old testament', 'hebrew scripture', 'torah', 'mosaic law', 'moses', 'abraham', 'covenant'],
  },
  {
    tag: 'New Testament',
    keywords: ['matthew', 'mark', 'luke', 'john', 'acts', 'romans', 'corinthians', 'galatians', 'ephesians', 'philippians', 'revelation', 'new testament', 'gospel', 'jesus', 'apostle', 'paul', 'disciple', 'church'],
  },
  {
    tag: 'Prayer',
    keywords: ['prayer', 'pray', 'praying', 'intercession', 'petition', 'worship', 'praise', "lord's prayer", 'thanksgiving', 'fasting'],
  },
  {
    tag: 'History',
    keywords: ['history', 'historical', 'ancient', 'roman empire', 'israel', 'babylon', 'assyria', 'egypt', 'greek', 'hellenistic', 'reformation', 'canon', 'intertestamental'],
  },
  {
    tag: 'Devotional',
    keywords: ['devotion', 'devotional', 'daily life', 'application', 'spiritual growth', 'discipleship', 'encouragement', 'comfort'],
  },
  {
    tag: 'Prophecy',
    keywords: ['prophecy', 'prophetic', 'prophet', 'fulfillment', 'messianic', 'end times', 'eschatology', 'second coming', 'apocalypse'],
  },
];

export function detectTags(text: string, existingTags: string[]): string[] {
  const lower = text.toLowerCase();
  const existingSet = new Set(existingTags);
  return TAG_RULES
    .filter(rule => !existingSet.has(rule.tag) && rule.keywords.some(kw => lower.includes(kw)))
    .map(rule => rule.tag);
}
