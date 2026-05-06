export interface WordPair {
  spanish: string;
  english: string;
}

/** Word in the active category deck (index = position in that list). */
export interface IndexedWord extends WordPair {
  id: number;
  index: number;
}

export interface CategorySummary {
  id: number;
  name: string;
  wordCount: number;
}

export interface VocabularyWordsPage {
  items: { id: number; spanish: string; english: string }[];
  total: number;
}

/** GET /vocabulary/search and GET /vocabulary/categories/:id/search */
export interface VocabularySearchItem {
  id: number;
  spanish: string;
  english: string;
  categoryId: number;
  categoryName: string;
}

export interface VocabularySearchResponse {
  items: VocabularySearchItem[];
}

/** Full rows for words marked known (from GET /vocabulary/learned/words). */
export interface LearnedWordRow {
  id: number;
  spanish: string;
  english: string;
  categoryId: number;
  categoryName: string;
}
