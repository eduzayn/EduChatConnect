/**
 * Configuração e conexão com banco de dados PostgreSQL
 */
import { Pool } from "pg";
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<any> & {
    $client: Pool;
};
export declare function testDatabaseConnection(): Promise<boolean>;
export declare function closeDatabase(): Promise<void>;
