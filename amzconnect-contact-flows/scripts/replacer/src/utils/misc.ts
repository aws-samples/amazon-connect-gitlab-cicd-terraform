/**
 * A utility class containing static methods for string manipulation and Map filtering.
 */
export class Utils {
  /**
   * Removes the specified substring from the end of the given string.
   *
   * @param {string} str - The input string.
   * @param {string} trimStr - The substring to remove from the end of the string.
   * @returns {Promise<string>} A promise that resolves with the trimmed string.
   */
  static async trimEndString(str: string, trimStr: string): Promise<string> {
    if (str.endsWith(trimStr)) {
      return str.slice(0, -trimStr.length);
    }
    return str;
  }

  /**
   * Filters a Map by keys that start with the specified prefix.
   *
   * @param {Map<K, V>} map - The input Map.
   * @param {string} prefix - The prefix to filter the keys by.
   * @returns {Map<K, V>} A new Map containing only the entries with keys that start with the specified prefix.
   */
  static filterMapByKeyPrefix<K extends string, V>(
    map: Map<K, V>,
    prefix: string,
  ): Map<K, V> {
    const filteredMap = new Map<K, V>();

    for (const [key, value] of map.entries()) {
      if (key.startsWith(prefix)) {
        filteredMap.set(key, value);
      }
    }

    return filteredMap;
  }

  static replaceRegionInArns(
    mappingMap: Map<string, string>,
  ): Map<string, string> {
    const validRegions = [
      "us-east-1",
      "us-west-2",
      "eu-central-1",
      "eu-west-2",
    ];
    const regionPlaceholder = "$.AwsRegion";

    const result: Map<string, string> = new Map();

    for (const [key, value] of mappingMap.entries()) {
      if (value.includes("arn:aws:lambda:") || value.includes("arn:aws:lex:")) {
        const arnParts = value.split(":");
        const region = arnParts[3];
        if (validRegions.includes(region)) {
          arnParts[3] = regionPlaceholder;
          result.set(key, arnParts.join(":"));
        } else {
          result.set(key, value);
        }
      } else {
        result.set(key, value);
      }
    }

    return result;
  }
}
