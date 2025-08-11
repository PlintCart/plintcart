# Network Connectivity Troubleshooting Guide

## Common Network Errors and Solutions

### 1. ERR_BLOCKED_BY_CLIENT
**What it means:** Browser extensions or ad blockers are blocking Firebase requests.

**Solutions:**
- Disable ad blockers (uBlock Origin, AdBlock Plus, etc.)
- Disable browser extensions temporarily
- Add your domain to ad blocker whitelist
- Try incognito/private browsing mode

### 2. ERR_NAME_NOT_RESOLVED
**What it means:** DNS cannot resolve Firebase service URLs.

**Solutions:**
- Check internet connection
- Try different DNS servers (8.8.8.8, 1.1.1.1)
- Restart your router/modem
- Try different network (mobile hotspot)
- Check if your ISP is blocking Google services

### 3. ERR_NETWORK_IO_SUSPENDED
**What it means:** Network connection was suspended or interrupted.

**Solutions:**
- Check network stability
- Restart browser
- Check for network congestion
- Try wired connection instead of WiFi
- Disable VPN temporarily

## Firewall and Security Settings

### Corporate Networks
If you're on a corporate network:
- Contact IT to whitelist Firebase domains
- Required domains:
  - `*.firebaseapp.com`
  - `*.googleapis.com`
  - `*.gstatic.com`
  - `securetoken.googleapis.com`

### Antivirus Software
Some antivirus programs block Firebase:
- Add Firebase domains to exceptions
- Temporarily disable real-time protection
- Check web protection settings

## Browser-Specific Solutions

### Chrome
1. Clear cache and cookies
2. Reset Chrome settings
3. Disable extensions
4. Check site permissions

### Firefox
1. Clear cache and cookies
2. Disable tracking protection for the site
3. Check about:config for blocked domains

### Safari
1. Clear website data
2. Disable content blockers
3. Check privacy settings

## Network Testing Commands

### Windows
```cmd
# Test DNS resolution
nslookup firebaseapp.com
nslookup googleapis.com

# Flush DNS cache
ipconfig /flushdns

# Reset network stack
netsh winsock reset
```

### macOS/Linux
```bash
# Test DNS resolution
dig firebaseapp.com
dig googleapis.com

# Flush DNS cache (macOS)
sudo dscacheutil -flushcache

# Flush DNS cache (Linux)
sudo systemctl restart systemd-resolved
```

## Advanced Troubleshooting

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for specific error messages
4. Note the exact error codes

### Test Different Networks
- Try mobile hotspot
- Use different WiFi network
- Test with ethernet connection
- Use VPN or proxy

### Browser Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try the action that's failing
4. Look for failed requests (red entries)
5. Check response codes and error details

## Quick Fixes Checklist

- [ ] Check internet connection
- [ ] Disable ad blockers
- [ ] Try incognito/private mode
- [ ] Clear browser cache
- [ ] Restart browser
- [ ] Try different browser
- [ ] Check firewall settings
- [ ] Disable VPN temporarily
- [ ] Try different network
- [ ] Contact network administrator (if on corporate network)

## When All Else Fails

1. **Test on different device:** Check if issue is device-specific
2. **Test at different time:** Network congestion might be temporary
3. **Contact ISP:** Your internet provider might be blocking services
4. **Use mobile app:** If available, try mobile version
5. **Contact support:** Provide specific error messages and troubleshooting steps tried

## Error Code Reference

| Error Code | Description | Common Cause |
|------------|-------------|--------------|
| ERR_BLOCKED_BY_CLIENT | Request blocked by browser | Ad blockers, extensions |
| ERR_NAME_NOT_RESOLVED | DNS resolution failed | Network, DNS issues |
| ERR_NETWORK_IO_SUSPENDED | Network connection suspended | Connectivity issues |
| ERR_INTERNET_DISCONNECTED | No internet connection | Network down |
| ERR_CONNECTION_REFUSED | Server refused connection | Firewall, proxy |
| ERR_CONNECTION_TIMED_OUT | Request timed out | Slow/unstable connection |

## Prevention Tips

1. **Keep browser updated**
2. **Use reliable internet connection**
3. **Whitelist Firebase domains in security software**
4. **Avoid using multiple ad blockers**
5. **Regularly clear browser cache**
6. **Test connectivity periodically**
