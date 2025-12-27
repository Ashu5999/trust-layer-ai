// ═══════════════════════════════════════════════════════════════════════════
// TrustLayer AI - Cortensor Router Client
// OpenAI-compatible REST API client for Cortensor decentralized inference
// ═══════════════════════════════════════════════════════════════════════════

import { 
  CortensorConfig, 
  CortensorRouterInfo, 
  CortensorRouterStatus,
  CortensorMiner,
  CortensorSession,
  CortensorCompletionRequest,
  CortensorCompletionResponse,
  CortensorError
} from '@/types';

// Default configuration for demo/development
export const DEFAULT_CORTENSOR_CONFIG: CortensorConfig = {
  router_url: '', // Will be configured by user or demo mode
  api_key: 'default-dev-token',
  timeout_ms: 60000,
  retry_attempts: 3,
};

/**
 * Cortensor Router API Client
 * Implements the Web2 REST API for Cortensor Router v1
 */
export class CortensorClient {
  private config: CortensorConfig;
  
  constructor(config: Partial<CortensorConfig> = {}) {
    this.config = { ...DEFAULT_CORTENSOR_CONFIG, ...config };
  }
  
  private get baseUrl(): string {
    return this.config.router_url.replace(/\/$/, '');
  }
  
  private get headers(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.api_key}`,
      'Content-Type': 'application/json',
    };
  }
  
  /**
   * Make authenticated request to Cortensor Router
   */
  private async request<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout_ms);
    
    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        const error: CortensorError = {
          code: response.status === 401 ? 'AUTH_FAILED' : 
                response.status === 503 ? 'MINER_UNAVAILABLE' : 'UNKNOWN',
          message: `HTTP ${response.status}: ${errorText}`,
          is_recoverable: response.status >= 500,
        };
        throw error;
      }
      
      return response.json();
    } catch (err) {
      clearTimeout(timeout);
      
      if (err && typeof err === 'object' && 'code' in err) {
        throw err; // Re-throw CortensorError
      }
      
      if (err instanceof Error && err.name === 'AbortError') {
        const error: CortensorError = {
          code: 'TIMEOUT',
          message: `Request timeout after ${this.config.timeout_ms}ms`,
          is_recoverable: true,
        };
        throw error;
      }
      
      const error: CortensorError = {
        code: 'CONNECTION_FAILED',
        message: err instanceof Error ? err.message : 'Connection failed',
        is_recoverable: true,
      };
      throw error;
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // API ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * GET /api/v1/info - Router node information
   */
  async getInfo(): Promise<CortensorRouterInfo> {
    return this.request<CortensorRouterInfo>('GET', '/api/v1/info');
  }
  
  /**
   * GET /api/v1/status - Router health and status
   */
  async getStatus(): Promise<CortensorRouterStatus> {
    return this.request<CortensorRouterStatus>('GET', '/api/v1/status');
  }
  
  /**
   * GET /api/v1/miners - List connected miners
   */
  async getMiners(): Promise<CortensorMiner[]> {
    return this.request<CortensorMiner[]>('GET', '/api/v1/miners');
  }
  
  /**
   * GET /api/v1/sessions - List active sessions
   */
  async getSessions(): Promise<CortensorSession[]> {
    return this.request<CortensorSession[]>('GET', '/api/v1/sessions');
  }
  
  /**
   * GET /api/v1/sessions/{sessionId} - Get session details
   */
  async getSession(sessionId: number): Promise<CortensorSession> {
    return this.request<CortensorSession>('GET', `/api/v1/sessions/${sessionId}`);
  }
  
  /**
   * POST /api/v1/completions - Submit inference task
   */
  async createCompletion(
    request: CortensorCompletionRequest,
    sessionId?: number
  ): Promise<CortensorCompletionResponse> {
    const sid = sessionId ?? request.session_id ?? 0;
    const endpoint = `/api/v1/completions/${sid}`;
    
    const body = {
      prompt: request.prompt,
      stream: request.stream ?? false,
      timeout: request.timeout ?? 60,
    };
    
    return this.request<CortensorCompletionResponse>('POST', endpoint, body);
  }
  
  /**
   * Health check - verify router is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getStatus();
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Configure router URL
   */
  setRouterUrl(url: string): void {
    this.config.router_url = url;
  }
  
  /**
   * Configure API key
   */
  setApiKey(key: string): void {
    this.config.api_key = key;
  }
  
  /**
   * Get current configuration
   */
  getConfig(): CortensorConfig {
    return { ...this.config };
  }
}

// Singleton instance for app-wide use
export const cortensorClient = new CortensorClient();
