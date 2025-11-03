/**
 * Search indexing pipeline
 * Supports Elasticsearch, Meilisearch, or Algolia
 */

/**
 * Search engine configuration
 */
export interface SearchConfig {
  /** Search engine type */
  engine: 'elasticsearch' | 'meilisearch' | 'algolia' | 'local';
  /** API endpoint */
  endpoint?: string;
  /** API key */
  apiKey?: string;
  /** Index name */
  indexName: string;
}

/**
 * Document to index
 */
export interface SearchDocument {
  id: string;
  type: string;
  title: string;
  content: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  publishedAt?: Date;
  updatedAt?: Date;
}

/**
 * Search result
 */
export interface SearchResult {
  id: string;
  type: string;
  title: string;
  snippet: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Get search configuration from environment
 */
export function getSearchConfig(): SearchConfig {
  const engine = (process.env.SEARCH_ENGINE || 'local') as SearchConfig['engine'];
  
  return {
    engine,
    endpoint: process.env.SEARCH_ENDPOINT,
    apiKey: process.env.SEARCH_API_KEY,
    indexName: process.env.SEARCH_INDEX_NAME || 'pet-social-network',
  };
}

/**
 * Search adapter interface
 */
export interface SearchAdapter {
  index(document: SearchDocument): Promise<void>;
  indexBatch(documents: SearchDocument[]): Promise<void>;
  search(query: string, filters?: Record<string, unknown>, limit?: number): Promise<SearchResult[]>;
  delete(id: string): Promise<void>;
  deleteByType(type: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Local search adapter (fallback using Prisma)
 */
class LocalSearchAdapter implements SearchAdapter {
  async index(document: SearchDocument): Promise<void> {
    // Store in database search index table
    // This is a simplified version - implement proper full-text search
    console.log('Indexing document locally:', document.id);
  }

  async indexBatch(documents: SearchDocument[]): Promise<void> {
    for (const doc of documents) {
      await this.index(doc);
    }
  }

  async search(query: string, filters?: Record<string, unknown>, limit: number = 20): Promise<SearchResult[]> {
    // Implement local search using Prisma
    // This is a placeholder - implement proper full-text search
    console.log('Searching locally:', query);
    return [];
  }

  async delete(id: string): Promise<void> {
    console.log('Deleting from index:', id);
  }

  async deleteByType(type: string): Promise<void> {
    console.log('Deleting type from index:', type);
  }

  async clear(): Promise<void> {
    console.log('Clearing search index');
  }
}

/**
 * Elasticsearch adapter
 */
class ElasticsearchAdapter implements SearchAdapter {
  private endpoint: string;
  private indexName: string;

  constructor(config: SearchConfig) {
    this.endpoint = config.endpoint || 'http://localhost:9200';
    this.indexName = config.indexName;
  }

  async index(document: SearchDocument): Promise<void> {
    try {
      const response = await fetch(`${this.endpoint}/${this.indexName}/_doc/${document.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...document,
          publishedAt: document.publishedAt?.toISOString(),
          updatedAt: document.updatedAt?.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Elasticsearch index failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Elasticsearch index error:', error);
      throw error;
    }
  }

  async indexBatch(documents: SearchDocument[]): Promise<void> {
    const body = documents.flatMap((doc) => [
      { index: { _index: this.indexName, _id: doc.id } },
      {
        ...doc,
        publishedAt: doc.publishedAt?.toISOString(),
        updatedAt: doc.updatedAt?.toISOString(),
      },
    ]);

    try {
      const response = await fetch(`${this.endpoint}/_bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-ndjson' },
        body: body.map((item) => JSON.stringify(item)).join('\n') + '\n',
      });

      if (!response.ok) {
        throw new Error(`Elasticsearch bulk index failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Elasticsearch bulk index error:', error);
      throw error;
    }
  }

  async search(query: string, filters?: Record<string, unknown>, limit: number = 20): Promise<SearchResult[]> {
    try {
      const searchBody: Record<string, unknown> = {
        query: {
          multi_match: {
            query,
            fields: ['title^2', 'content', 'tags'],
          },
        },
        size: limit,
      };

      if (filters) {
        searchBody.query = {
          bool: {
            must: searchBody.query,
            filter: Object.entries(filters).map(([key, value]) => ({ term: { [key]: value } })),
          },
        };
      }

      const response = await fetch(`${this.endpoint}/${this.indexName}/_search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchBody),
      });

      if (!response.ok) {
        throw new Error(`Elasticsearch search failed: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format")
      }

      const data = await response.json();
      return data.hits.hits.map((hit: any) => ({
        id: hit._id,
        type: hit._source.type,
        title: hit._source.title,
        snippet: hit._source.content?.substring(0, 200) || '',
        score: hit._score,
        metadata: hit._source.metadata,
      }));
    } catch (error) {
      console.error('Elasticsearch search error:', error);
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await fetch(`${this.endpoint}/${this.indexName}/_doc/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Elasticsearch delete error:', error);
    }
  }

  async deleteByType(type: string): Promise<void> {
    try {
      await fetch(`${this.endpoint}/${this.indexName}/_delete_by_query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: { term: { type } },
        }),
      });
    } catch (error) {
      console.error('Elasticsearch deleteByType error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await fetch(`${this.endpoint}/${this.indexName}/_delete_by_query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: { match_all: {} },
        }),
      });
    } catch (error) {
      console.error('Elasticsearch clear error:', error);
    }
  }
}

/**
 * Get search adapter based on configuration
 */
function getSearchAdapter(): SearchAdapter {
  const config = getSearchConfig();

  switch (config.engine) {
    case 'elasticsearch':
      return new ElasticsearchAdapter(config);
    case 'meilisearch':
    case 'algolia':
      // Implement Meilisearch/Algolia adapters similarly
      console.warn(`${config.engine} adapter not implemented, using local fallback`);
      return new LocalSearchAdapter();
    default:
      return new LocalSearchAdapter();
  }
}

// Singleton search adapter
let searchAdapter: SearchAdapter | null = null;

function getSearch(): SearchAdapter {
  if (!searchAdapter) {
    searchAdapter = getSearchAdapter();
  }
  return searchAdapter;
}

/**
 * Index a document
 */
export async function indexDocument(document: SearchDocument): Promise<void> {
  await getSearch().index(document);
}

/**
 * Index multiple documents in batch
 */
export async function indexDocuments(documents: SearchDocument[]): Promise<void> {
  await getSearch().indexBatch(documents);
}

/**
 * Search documents
 */
export async function searchDocuments(
  query: string,
  filters?: Record<string, unknown>,
  limit: number = 20
): Promise<SearchResult[]> {
  return getSearch().search(query, filters, limit);
}

/**
 * Delete document from index
 */
export async function deleteFromIndex(id: string): Promise<void> {
  await getSearch().delete(id);
}

/**
 * Reindex content type
 */
export async function reindexContentType(
  contentType: string,
  fetcher: () => Promise<SearchDocument[]>
): Promise<void> {
  // Delete existing documents of this type
  await getSearch().deleteByType(contentType);

  // Fetch and index all documents
  const documents = await fetcher();
  await getSearch().indexBatch(documents);
}

