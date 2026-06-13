
## PM2 Services

| Port | Name | Type |
|------|------|------|
| 3001 | fusion-backend | Express.js |
| 5173 | fusion-frontend | Vite |

**Terminal Commands:**
```bash
pm2 start ecosystem.config.cjs   # First time
pm2 start all                    # After first time
pm2 stop all / pm2 restart all
pm2 start fusion-backend / pm2 stop fusion-backend
pm2 start fusion-frontend / pm2 stop fusion-frontend
pm2 logs / pm2 status / pm2 monit
pm2 save                         # Save process list
pm2 resurrect                    # Restore saved list
```
