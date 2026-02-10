# Hostinger 503 Error Troubleshooting Guide

## Common Causes of 503 Errors on Hostinger Shared Hosting

### 1. **Database Connection Issues** ⚠️ MOST COMMON
- **Problem**: MySQL connection fails or times out
- **Symptoms**: 503 errors on all API endpoints
- **Solutions**:
  - Verify MySQL credentials in `.env` file
  - Check if MySQL host requires port (e.g., `host:port`)
  - Ensure MySQL user has proper permissions
  - Verify database exists
  - Check if Hostinger requires SSL for MySQL connections

### 2. **Server Not Starting Properly**
- **Problem**: Node.js process crashes or fails to start
- **Symptoms**: 503 immediately after deployment
- **Solutions**:
  - Check Hostinger Node.js logs
  - Verify `package.json` has correct `start` script
  - Ensure Node.js version compatibility
  - Check if all dependencies are installed

### 3. **Database Initialization Blocking**
- **Problem**: Database initialization hangs or fails silently
- **Symptoms**: Server starts but all requests return 503
- **Solutions**:
  - Add timeout to database initialization
  - Ensure database initialization completes before accepting requests
  - Check database connection pool settings

### 4. **Connection Pool Exhaustion**
- **Problem**: Too many connections or connections not being released
- **Symptoms**: Intermittent 503 errors, especially under load
- **Solutions**:
  - Reduce `connectionLimit` (shared hosting typically allows 5-10 max)
  - Ensure all connections are properly released
  - Add connection timeout settings

### 5. **Resource Limits (Memory/CPU)**
- **Problem**: Hostinger shared hosting resource limits exceeded
- **Symptoms**: 503 errors during peak usage
- **Solutions**:
  - Optimize database queries
  - Reduce connection pool size
  - Implement request rate limiting
  - Check Hostinger resource usage dashboard

### 6. **Port Configuration Issues**
- **Problem**: Wrong port or port not accessible
- **Symptoms**: 503 on all requests
- **Solutions**:
  - Use Hostinger's specified Node.js port (usually in environment variables)
  - Check if port needs to be configured in Hostinger panel
  - Verify firewall settings

### 7. **Environment Variables Not Set**
- **Problem**: `.env` file not loaded or variables missing
- **Symptoms**: 503 errors, database connection failures
- **Solutions**:
  - Set environment variables in Hostinger control panel
  - Verify `.env` file is in correct location
  - Check if Hostinger requires different method for env vars

### 8. **Process Manager Not Running**
- **Problem**: Node.js process not managed/restarted automatically
- **Symptoms**: 503 after server restart or crash
- **Solutions**:
  - Configure PM2 or similar process manager
  - Set up auto-restart on failure
  - Check Hostinger's process management options

### 9. **MySQL Connection Timeout**
- **Problem**: MySQL connections timeout before completing
- **Symptoms**: Slow responses leading to 503
- **Solutions**:
  - Increase connection timeout settings
  - Add retry logic for database operations
  - Optimize slow queries

### 10. **SSL/TLS Requirements**
- **Problem**: Hostinger MySQL requires SSL connections
- **Symptoms**: Database connection failures
- **Solutions**:
  - Enable SSL in MySQL connection config
  - Add SSL certificates if required

## Quick Diagnostic Steps

1. **Check Server Logs**:
   ```bash
   # In Hostinger, check Node.js application logs
   # Look for database connection errors
   # Look for uncaught exceptions
   ```

2. **Test Database Connection**:
   ```bash
   # Create a test script to verify DB connection
   node test-db-connection.js
   ```

3. **Check Health Endpoint**:
   ```bash
   curl https://your-domain.com/health
   # Should return {"status":"ok"}
   ```

4. **Verify Environment Variables**:
   - DB_HOST
   - DB_USER
   - DB_PASSWORD
   - DB_NAME
   - PORT
   - JWT_SECRET

5. **Monitor Resource Usage**:
   - Check Hostinger control panel for CPU/Memory usage
   - Look for resource limit warnings

## Recommended Configuration for Hostinger

### Database Connection Pool Settings
```javascript
{
  connectionLimit: 5,        // Reduced for shared hosting
  queueLimit: 10,           // Limited queue
  acquireTimeout: 60000,    // 60 seconds
  timeout: 60000,            // 60 seconds
  reconnect: true
}
```

### Server Configuration
- Use environment variable for PORT
- Add graceful shutdown handling
- Implement health check endpoint
- Add request timeout middleware
- Enable proper error logging

## Testing Checklist

- [ ] Database connection successful
- [ ] Environment variables loaded
- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] Database initialization completes
- [ ] API endpoints respond (not 503)
- [ ] No memory leaks
- [ ] Connection pool not exhausted
- [ ] SSL configured if required
- [ ] Process manager running
