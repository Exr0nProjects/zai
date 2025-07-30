/**
 * Time Gutter Formatting Utilities
 * Formats timestamps for the left time gutter display
 */

/**
 * Get the most recent 4am local time
 */
function getMostRecent4AM() {
  const now = new Date();
  const today4AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 0, 0);
  
  // If it's currently before 4am, use yesterday's 4am
  if (now.getHours() < 4) {
    today4AM.setDate(today4AM.getDate() - 1);
  }
  
  return today4AM;
}

/**
 * Check if a date is within the past day (after most recent 4am)
 */
function isWithinPastDay(date) {
  const recent4AM = getMostRecent4AM();
  return date >= recent4AM;
}

/**
 * Format time for display in the gutter
 * @param {Date} date - The date to format
 * @returns {string} - Formatted time string
 */
export function formatTimeGutter(date) {
  if (!date || isNaN(date.getTime())) {
    return '';
  }
  
  const now = new Date();
  const timeDiff = now.getTime() - date.getTime();
  
  // Within the past day (after most recent 4am): show time like "10:55"
  if (isWithinPastDay(date)) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
  }
  
  // Calculate time periods
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30.44 * oneDay; // Average month length
  const oneYear = 365.25 * oneDay; // Account for leap years
  
  // Within the past week: "x days ago"
  if (timeDiff < oneWeek) {
    const days = Math.floor(timeDiff / oneDay);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }
  
  // Within the past month: "x.y weeks ago"
  if (timeDiff < oneMonth) {
    const weeks = timeDiff / oneWeek;
    const wholeWeeks = Math.floor(weeks);
    const fractionalWeek = Math.floor((weeks - wholeWeeks) * 10);
    
    if (wholeWeeks === 1 && fractionalWeek === 0) return '1 week ago';
    if (fractionalWeek === 0) return `${wholeWeeks} weeks ago`;
    return `${wholeWeeks}.${fractionalWeek} weeks ago`;
  }
  
  // Within the past year: "x.y months ago"
  if (timeDiff < oneYear) {
    const months = timeDiff / oneMonth;
    const wholeMonths = Math.floor(months);
    const fractionalMonth = Math.floor((months - wholeMonths) * 10);
    
    if (wholeMonths === 1 && fractionalMonth === 0) return '1 month ago';
    if (fractionalMonth === 0) return `${wholeMonths} months ago`;
    return `${wholeMonths}.${fractionalMonth} months ago`;
  }
  
  // Beyond a year: "x.y years ago"
  const years = timeDiff / oneYear;
  const wholeYears = Math.floor(years);
  const fractionalYear = Math.floor((years - wholeYears) * 10);
  
  if (wholeYears === 1 && fractionalYear === 0) return '1 year ago';
  if (fractionalYear === 0) return `${wholeYears} years ago`;
  return `${wholeYears}.${fractionalYear} years ago`;
}

/**
 * Get the timestamp to display for a block based on timelineTime or createdAt
 * @param {Object} blockAttrs - Block attributes containing timelineTime and/or createdAt
 * @returns {string} - Formatted time string
 */
export function getBlockTimeDisplay(blockAttrs) {
  // Prefer timelineTime if available, fallback to createdAt
  let timeToUse = null;
  
  if (blockAttrs.timelineTime && blockAttrs.timelineTime !== 'null') {
    timeToUse = new Date(blockAttrs.timelineTime);
  } else if (blockAttrs.createdAt) {
    // Handle both ISO string and timestamp formats for createdAt
    timeToUse = blockAttrs.createdAt.includes('T') 
      ? new Date(blockAttrs.createdAt)
      : new Date(parseInt(blockAttrs.createdAt));
  }
  
  if (!timeToUse || isNaN(timeToUse.getTime())) {
    return '';
  }
  
  return formatTimeGutter(timeToUse);
} 