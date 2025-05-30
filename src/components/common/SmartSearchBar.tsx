import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { theme } from '../../styles/theme';
import SearchSuggestionsService from '../../services/searchSuggestionsService';
import { HapticService } from '../../services/hapticService';

interface SearchSuggestion {
  query: string;
  type: 'recent' | 'popular' | 'category' | 'muscle';
  timestamp?: number;
}

interface SmartSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: (query: string) => void;
  showSuggestions?: boolean;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search exercises, muscles, or equipment...",
  onSubmit,
  showSuggestions = true
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (showSuggestions && (isFocused || value.trim())) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestionsList(false);
    }
  }, [value, isFocused, showSuggestions]);

  const loadSuggestions = async () => {
    try {
      const suggestionsList = await SearchSuggestionsService.getSuggestions(value);
      setSuggestions(suggestionsList);
      setShowSuggestionsList(suggestionsList.length > 0 && isFocused);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const handleSuggestionPress = async (suggestion: SearchSuggestion) => {
    HapticService.selection();
    
    onChangeText(suggestion.query);
    setShowSuggestionsList(false);
    inputRef.current?.blur();
    
    // Save as recent search
    await SearchSuggestionsService.saveRecentSearch(suggestion.query);
    
    // Trigger submit
    onSubmit?.(suggestion.query);
  };

  const handleSubmit = async () => {
    if (value.trim()) {
      await SearchSuggestionsService.saveRecentSearch(value.trim());
      onSubmit?.(value.trim());
      setShowSuggestionsList(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    HapticService.impact('light');
    onChangeText('');
    setShowSuggestionsList(false);
  };

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.suggestionIcon}>
        {SearchSuggestionsService.getSearchIcon(item.type)}
      </Text>
      <Text style={styles.suggestionText}>{item.query}</Text>
      <Text style={styles.suggestionType}>{item.type}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)} // Delay to allow suggestion tap
          onSubmitEditing={handleSubmit}
          placeholderTextColor={theme.colors.textSecondary}
          returnKeyType="search"
        />
        
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {showSuggestionsList && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.query}-${index}`}
            renderItem={renderSuggestion}
            style={styles.suggestionsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clearButton: {
    position: 'absolute',
    right: theme.spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.textSecondary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 200,
    zIndex: 1001,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '50',
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: theme.spacing.md,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
  },
  suggestionType: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
});

export default SmartSearchBar; 