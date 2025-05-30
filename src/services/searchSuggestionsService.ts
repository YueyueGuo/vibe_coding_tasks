import { StorageManager } from '../utils/storage';
import { Exercise } from '../types';

interface SearchSuggestion {
  query: string;
  type: 'recent' | 'popular' | 'category' | 'muscle';
  timestamp?: number;
}

class SearchSuggestionsService {
  private readonly RECENT_SEARCHES_KEY = 'recent_searches';
  private readonly MAX_RECENT_SEARCHES = 10;

  // Popular search terms
  private readonly POPULAR_SEARCHES: SearchSuggestion[] = [
    { query: 'chest', type: 'muscle' },
    { query: 'back', type: 'muscle' },
    { query: 'legs', type: 'muscle' },
    { query: 'shoulders', type: 'muscle' },
    { query: 'arms', type: 'muscle' },
    { query: 'push', type: 'category' },
    { query: 'pull', type: 'category' },
    { query: 'bench press', type: 'popular' },
    { query: 'deadlift', type: 'popular' },
    { query: 'squat', type: 'popular' },
    { query: 'bicep curl', type: 'popular' },
    { query: 'pushup', type: 'popular' },
    { query: 'bodyweight', type: 'category' },
    { query: 'dumbbell', type: 'category' },
    { query: 'beginner', type: 'category' },
  ];

  async saveRecentSearch(query: string): Promise<void> {
    try {
      if (!query.trim() || query.length < 2) return;

      const recentSearches = await this.getRecentSearches();
      
      // Remove existing search if it exists
      const filteredSearches = recentSearches.filter(search => 
        search.query.toLowerCase() !== query.toLowerCase()
      );

      // Add new search to the beginning
      const newSearch: SearchSuggestion = {
        query: query.trim(),
        type: 'recent',
        timestamp: Date.now()
      };

      const updatedSearches = [newSearch, ...filteredSearches].slice(0, this.MAX_RECENT_SEARCHES);
      
      await StorageManager.setItem(this.RECENT_SEARCHES_KEY, updatedSearches);
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  }

  async getRecentSearches(): Promise<SearchSuggestion[]> {
    try {
      const searches = await StorageManager.getItem<SearchSuggestion[]>(this.RECENT_SEARCHES_KEY);
      return searches || [];
    } catch (error) {
      console.error('Failed to get recent searches:', error);
      return [];
    }
  }

  async clearRecentSearches(): Promise<void> {
    try {
      await StorageManager.removeItem(this.RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }

  async getSuggestions(currentQuery: string = ''): Promise<SearchSuggestion[]> {
    const recentSearches = await this.getRecentSearches();
    const allSuggestions = [...recentSearches, ...this.POPULAR_SEARCHES];

    if (!currentQuery.trim()) {
      return allSuggestions.slice(0, 8);
    }

    // Filter suggestions based on current query
    const query = currentQuery.toLowerCase();
    const filteredSuggestions = allSuggestions.filter(suggestion =>
      suggestion.query.toLowerCase().includes(query) &&
      suggestion.query.toLowerCase() !== query
    );

    return filteredSuggestions.slice(0, 6);
  }

  getSearchIcon(type: SearchSuggestion['type']): string {
    switch (type) {
      case 'recent': return '🕒';
      case 'popular': return '🔥';
      case 'category': return '📂';
      case 'muscle': return '💪';
      default: return '🔍';
    }
  }
}

export default new SearchSuggestionsService(); 