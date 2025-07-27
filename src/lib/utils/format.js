export function formatTime(noteTime) {  
  if (noteTime === 'now') {
    return 'now';
  }
  const timeStr = noteTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    return timeStr;
}