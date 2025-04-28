/**
 * MySQL Adapter for Employee Management System
 * This file adapts the application to work with MySQL instead of PostgreSQL
 * 
 * How to use:
 * 1. Save this file to your project
 * 2. Install mysql2 package: npm install mysql2
 * 3. Replace the database connection in server/db.ts with this adapter
 */

const mysql = require('mysql2/promise');

// Parse DATABASE_URL to get connection details
function parseDatabaseUrl(url) {
  try {
    // Format: mysql://username:password@hostname:port/database
    const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = url.match(regex);
    
    if (!match) {
      throw new Error('Invalid MySQL connection string format');
    }
    
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: parseInt(match[4], 10),
      database: match[5]
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    throw error;
  }
}

// Create connection pool
function createPool() {
  try {
    const connectionDetails = parseDatabaseUrl(process.env.DATABASE_URL);
    
    return mysql.createPool({
      host: connectionDetails.host,
      user: connectionDetails.user,
      password: connectionDetails.password,
      database: connectionDetails.database,
      port: connectionDetails.port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  } catch (error) {
    console.error('Failed to create MySQL connection pool:', error);
    throw error;
  }
}

// Adapter class to mimic PostgreSQL functionality
class MySQLAdapter {
  constructor() {
    this.pool = createPool();
  }
  
  // Execute a query with parameters
  async query(sql, params = []) {
    try {
      // Convert PostgreSQL style $1, $2 params to MySQL ? style
      let convertedSql = sql;
      if (params && params.length > 0) {
        // Replace $1, $2, etc. with ?
        convertedSql = sql.replace(/\$(\d+)/g, '?');
        
        // Reorder params if needed (since $1, $2 might not be in order)
        const reorderedParams = [];
        const paramRegex = /\$(\d+)/g;
        let match;
        while ((match = paramRegex.exec(sql)) !== null) {
          const index = parseInt(match[1], 10) - 1;
          reorderedParams.push(params[index]);
        }
        
        params = reorderedParams.length > 0 ? reorderedParams : params;
      }
      
      const [rows] = await this.pool.execute(convertedSql, params);
      return rows;
    } catch (error) {
      console.error('MySQL query error:', error);
      throw error;
    }
  }
  
  // Helper to retrieve one row
  async one(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }
  
  // Helper to run insert and return the inserted ID
  async insert(table, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    try {
      const result = await this.pool.execute(sql, values);
      return {
        ...data,
        id: result[0].insertId
      };
    } catch (error) {
      console.error('MySQL insert error:', error);
      throw error;
    }
  }
  
  // Helper to run update and return the updated row
  async update(table, id, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    
    try {
      await this.pool.execute(sql, [...values, id]);
      return {
        ...data,
        id
      };
    } catch (error) {
      console.error('MySQL update error:', error);
      throw error;
    }
  }
  
  // Helper to delete a row
  async delete(table, id) {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    
    try {
      const result = await this.pool.execute(sql, [id]);
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('MySQL delete error:', error);
      throw error;
    }
  }
}

module.exports = MySQLAdapter;