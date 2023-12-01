export class LangPercent {
  private static ranges: { [key: string]: [number, number][] } = {
    "繁體中文": [
      [0x3400, 0x4dbf],
      [0xf900, 0xfaff],
      [0x4e00, 0x9fff],
    ],
    "简体中文": [[0x4e00, 0x9fff]],
    "日本語": [
      [0x3040, 0x309f],
      [0x30a0, 0x30ff],
      [0x4e00, 0x9fff],
    ],
    "English": [
      [0x0041, 0x005a],
      [0x0061, 0x007a],
    ],
  };

  private static inRange(ucChar: number, ranges: [number, number][]): boolean {
    return ranges.some(([start, end]) => ucChar >= start && ucChar <= end);
  }

  private static calcPercent(text: string, lang: string): number {
    const langChars = Array.from(text).filter((char) =>
      this.inRange(char.charCodeAt(0), this.ranges[lang] || [])
    ).length;

    return text.length > 0 ? (langChars / text.length) * 100 : 0;
  }

  public static getLangs(
    text: string,
    defLang: string,
    tgtLang: string
  ): { defLang: string; tgtLang: string } {
    const defLangPercent = this.calcPercent(text, defLang);
    const tgtLangPercent = this.calcPercent(text, tgtLang);

    return defLangPercent > 50
      ? { defLang, tgtLang }
      : tgtLangPercent > 50
      ? { defLang: tgtLang, tgtLang: defLang }
      : { defLang, tgtLang };
  }
}
