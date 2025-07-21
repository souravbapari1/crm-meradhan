# Logout Scenarios Test Plan

## Current Session State
- Session 93: Active (ID: 93, Token: session_1753096020207_a1zqdj89n)
- Session 92: Still showing as active - should be cleaned up

## Test Scenarios

### 1. Manual Logout Test
- Action: Click logout button in header
- Expected: Session ends with reason 'logout', proper timestamp recorded
- Status: PENDING

### 2. 15-minute Inactivity Timeout Test
- Action: Leave browser inactive for 15+ minutes
- Expected: Session ends with reason 'timeout', automatic logout
- Status: PENDING

### 3. Browser/Tab Close Test
- Action: Close browser tab or window
- Expected: Session ends with reason 'browser_close' via sendBeacon
- Status: PENDING

### 4. Tab Hidden Timeout Test
- Action: Switch to another tab for 15+ minutes
- Expected: Session ends with reason 'browser_close' after visibility timeout
- Status: PENDING

### 5. Session Persistence Test
- Action: Refresh page multiple times
- Expected: Same session maintained, no duplicates created
- Status: PENDING

## Issues to Fix
1. Multiple active sessions (92, 93) - should have only one
2. Session reuse logic needs refinement
3. Verify all logout methods properly extract and send sessionToken