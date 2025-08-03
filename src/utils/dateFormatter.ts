/**
 * Utility functions for date formatting
 */

/**
 * Formats a date to dd/mm/yy format
 * @param date - Date object, timestamp in seconds, or ISO string
 * @returns Formatted date string in dd/mm/yy format
 */
export const formatDateToDDMMYY = (date: Date | number | string | null | undefined): string => {
  if (!date) return 'N/A';
  
  let dateObj: Date;
  
  if (typeof date === 'number') {
    // Handle Firestore timestamp (seconds)
    dateObj = new Date(date * 1000);
  } else if (typeof date === 'string') {
    // Handle ISO string
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    // Handle Date object
    dateObj = date;
  } else {
    return 'N/A';
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'N/A';
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear().toString().slice(-2);
  
  return `${day}/${month}/${year}`;
};

/**
 * Formats a Firestore timestamp object to dd/mm/yy format
 * @param timestamp - Firestore timestamp object with seconds property
 * @returns Formatted date string in dd/mm/yy format
 */
export const formatFirestoreTimestamp = (timestamp: { seconds: number } | null | undefined): string => {
  if (!timestamp || !timestamp.seconds) return 'N/A';
  return formatDateToDDMMYY(timestamp.seconds);
};

/**
 * Formats a date to dd/mm/yy HH:mm format for more detailed display
 * @param date - Date object, timestamp in seconds, or ISO string
 * @returns Formatted date string in dd/mm/yy HH:mm format
 */
export const formatDateTimeToDDMMYY = (date: Date | number | string | null | undefined): string => {
  if (!date) return 'N/A';
  
  let dateObj: Date;
  
  if (typeof date === 'number') {
    // Handle Firestore timestamp (seconds)
    dateObj = new Date(date * 1000);
  } else if (typeof date === 'string') {
    // Handle ISO string
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    // Handle Date object
    dateObj = date;
  } else {
    return 'N/A';
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'N/A';
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear().toString().slice(-2);
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}; 