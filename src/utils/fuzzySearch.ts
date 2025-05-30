export interface FuzzyMatch {
  item: any;
  score: number;
  matches: Array<{
    indices: number[][];
    value: string;
    key: string;
  }>;
}

export class FuzzySearchEngine {
  private threshold: number;
  private includeScore: boolean;
  private includeMatches: boolean;
  private minMatchCharLength: number;

  constructor(options: {
    threshold?: number;
    includeScore?: boolean;
    includeMatches?: boolean;
    minMatchCharLength?: number;
  } = {}) {
    this.threshold = options.threshold ?? 0.6;
    this.includeScore = options.includeScore ?? true;
    this.includeMatches = options.includeMatches ?? true;
    this.minMatchCharLength = options.minMatchCharLength ?? 1;
  }

  // Levenshtein distance calculation
  private getLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Calculate similarity score (0-1, where 1 is perfect match)
  private getSimilarityScore(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.getLevenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return 1 - (distance / maxLength);
  }

  // Find partial matches and their positions
  private findMatches(text: string, pattern: string): Array<{ indices: number[][]; value: string }> {
    const matches: Array<{ indices: number[][]; value: string }> = [];
    const lowerText = text.toLowerCase();
    const lowerPattern = pattern.toLowerCase();

    // Exact substring match
    let index = lowerText.indexOf(lowerPattern);
    if (index !== -1) {
      matches.push({
        indices: [[index, index + pattern.length - 1]],
        value: text.substring(index, index + pattern.length)
      });
    }

    // Word boundary matches
    const words = lowerText.split(/\s+/);
    let wordStartIndex = 0;
    
    for (const word of words) {
      const wordIndex = lowerText.indexOf(word, wordStartIndex);
      if (word.startsWith(lowerPattern) || this.getSimilarityScore(word, lowerPattern) >= this.threshold) {
        matches.push({
          indices: [[wordIndex, wordIndex + word.length - 1]],
          value: text.substring(wordIndex, wordIndex + word.length)
        });
      }
      wordStartIndex = wordIndex + word.length;
    }

    return matches;
  }

  // Search function for exercises
  searchExercises(exercises: any[], query: string, searchKeys: string[] = ['name', 'description', 'muscleGroups', 'instructions']): FuzzyMatch[] {
    if (!query.trim()) return exercises.map(item => ({ item, score: 1, matches: [] }));

    const results: FuzzyMatch[] = [];

    for (const exercise of exercises) {
      let bestScore = 0;
      const allMatches: Array<{ indices: number[][]; value: string; key: string }> = [];

      for (const key of searchKeys) {
        let searchText = '';
        
        if (key === 'muscleGroups' && Array.isArray(exercise[key])) {
          searchText = exercise[key].join(' ');
        } else if (key === 'instructions' && Array.isArray(exercise[key])) {
          searchText = exercise[key].join(' ');
        } else if (typeof exercise[key] === 'string') {
          searchText = exercise[key];
        } else {
          continue;
        }

        // Calculate similarity score for this field
        const score = this.getSimilarityScore(searchText, query);
        bestScore = Math.max(bestScore, score);

        // Find matches in this field
        if (score >= this.threshold || searchText.toLowerCase().includes(query.toLowerCase())) {
          const matches = this.findMatches(searchText, query);
          matches.forEach(match => {
            allMatches.push({ ...match, key });
          });
        }

        // Check for partial word matches
        const queryWords = query.toLowerCase().split(/\s+/);
        for (const queryWord of queryWords) {
          if (queryWord.length >= this.minMatchCharLength) {
            const wordScore = this.getSimilarityScore(searchText, queryWord);
            if (wordScore >= this.threshold) {
              bestScore = Math.max(bestScore, wordScore * 0.8); // Slightly lower score for partial matches
              const matches = this.findMatches(searchText, queryWord);
              matches.forEach(match => {
                allMatches.push({ ...match, key });
              });
            }
          }
        }
      }

      // Include exercise if it meets the threshold
      if (bestScore >= this.threshold || allMatches.length > 0) {
        results.push({
          item: exercise,
          score: bestScore,
          matches: allMatches
        });
      }
    }

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  // Specialized search for exercise names with common abbreviations
  searchWithAbbreviations(exercises: any[], query: string): FuzzyMatch[] {
    const abbreviationMap: { [key: string]: string[] } = {
      'bp': ['bench press', 'bench'],
      'dl': ['deadlift'],
      'sq': ['squat'],
      'ohp': ['overhead press', 'military press'],
      'db': ['dumbbell'],
      'bb': ['barbell'],
      'bw': ['bodyweight'],
      'reps': ['repetitions'],
      'lats': ['latissimus'],
      'delts': ['deltoids'],
      'bi': ['bicep', 'biceps'],
      'tri': ['tricep', 'triceps'],
      'abs': ['abdominal', 'abdominals'],
      'glutes': ['gluteus'],
      'quads': ['quadriceps'],
      'hams': ['hamstrings'],
      'calves': ['calf'],
    };

    // Expand query with abbreviations
    let expandedQuery = query.toLowerCase();
    for (const [abbr, expansions] of Object.entries(abbreviationMap)) {
      if (expandedQuery.includes(abbr)) {
        for (const expansion of expansions) {
          expandedQuery += ` ${expansion}`;
        }
      }
    }

    return this.searchExercises(exercises, expandedQuery);
  }
}

export const exerciseFuzzySearch = new FuzzySearchEngine({
  threshold: 0.3, // Lower threshold for more inclusive results
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2
}); 