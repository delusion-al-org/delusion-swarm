import { IEngramRepository, ObservationPayload, SearchParams, Observation, SaveResult } from '../../ports/engram-repository';

import { join } from 'node:path';
import * as fs from 'node:fs';

/**
 * SQLite Adapter for Engram Repository
 * ─────────────────────────────────────
 * Hexagonal Architecture: This is an ADAPTER.
 * It implements IEngramRepository using bun:sqlite.
 *
 * To swap to Postgres: implement the same interface in postgres-adapter.ts
 * and change the factory — zero changes to domain code required.
 */
export class SqliteEngramAdapter implements IEngramRepository {
  private db: any;

  constructor(dbPath?: string) {
    let Database;
    try {
      Database = require('bun:sqlite').Database;
    } catch(e) {
      try {
        Database = require('better-sqlite3');
      } catch(e2) {
        throw new Error('[SqliteEngramAdapter] Critical: Neither bun:sqlite nor better-sqlite3 found. SQLite persistence unavailable.');
      }
    }

    const path = dbPath || process.env.ENGRAM_DB_PATH || join(process.cwd(), '.engram-storage', 'engram.db');
    const dir = join(path, '..');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(path);
    this.init();
  }

  private init(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        project TEXT,
        topic_key TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_topic_key ON observations(topic_key)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_project ON observations(project)`);
  }

  async save(payload: ObservationPayload): Promise<SaveResult> {
    try {
      if (payload.topic_key) {
        const existing = this.db
          .query('SELECT id FROM observations WHERE topic_key = ?')
          .get(payload.topic_key) as { id: number } | null;

        if (existing) {
          this.db.run(
            'UPDATE observations SET title = ?, content = ?, type = ?, project = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [payload.title, payload.content, payload.type, payload.project ?? null, existing.id]
          );
          return { id: existing.id, success: true };
        }
      }

      const result = this.db.run(
        'INSERT INTO observations (title, content, type, project, topic_key) VALUES (?, ?, ?, ?, ?)',
        [payload.title, payload.content, payload.type, payload.project ?? null, payload.topic_key ?? null]
      );

      return { id: result.lastInsertRowid as number, success: true };
    } catch (e: any) {
      console.error(`[SQLiteAdapter] save failed: ${e.message}`);
      return { success: false };
    }
  }

  async search(params: SearchParams): Promise<Observation[]> {
    // Escape SQLite LIKE metacharacters to prevent injection via user-controlled query
    const escapedQuery = params.query.replace(/[%_\\]/g, '\\$&');
    let sql = 'SELECT * FROM observations WHERE (title LIKE ? ESCAPE "\\" OR content LIKE ? ESCAPE "\\")';
    const args: any[] = [`%${escapedQuery}%`, `%${escapedQuery}%`];

    if (params.project) {
      sql += ' AND project = ?';
      args.push(params.project);
    }
    if (params.type) {
      sql += ' AND type = ?';
      args.push(params.type);
    }
    sql += ' ORDER BY updated_at DESC LIMIT ?';
    args.push(params.limit ?? 10);

    return this.db.query(sql).all(...args) as Observation[];
  }
}
