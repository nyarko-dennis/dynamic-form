// Async validators for form fields

/**
 * Simulates checking if a username is available
 * In a real application, this would make an API call to the server
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // For demo purposes, consider usernames containing "admin" or "root" as taken
  const takenUsernames = ['admin', 'root', 'superuser', 'system']
  return !takenUsernames.some(name => username.toLowerCase().includes(name))
}

/**
 * Simulates validating an email domain
 * In a real application, this would check if the domain exists and is valid
 */
export async function isEmailDomainValid(email: string): Promise<boolean> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Simple validation for demo purposes
  if (!email || !email.includes('@')) return false
  
  const domain = email.split('@')[1]
  const validDomains = ['.com', '.org', '.net', '.edu', '.gov']
  return validDomains.some(validDomain => domain.endsWith(validDomain))
}

/**
 * Simulates validating a postal code format based on country
 */
export async function isPostalCodeValid(postalCode: string, country: string): Promise<boolean> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Simple validation for demo purposes
  if (!postalCode) return false
  
  switch (country.toLowerCase()) {
    case 'us':
      // US ZIP code: 5 digits or 5+4 format
      return /^\d{5}(-\d{4})?$/.test(postalCode)
    case 'ca':
      // Canadian postal code: A1A 1A1 format
      return /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/.test(postalCode)
    case 'uk':
      // UK postcode: Various formats
      return /^[A-Za-z]{1,2}\d[A-Za-z\d]? \d[A-Za-z]{2}$/.test(postalCode)
    default:
      // Default: Allow any non-empty string
      return postalCode.trim().length > 0
  }
}

// Registry of async validators that can be referenced by name in the form schema
export const asyncValidators: Record<string, (...args: unknown[]) => Promise<boolean>> = {
  isUsernameAvailable,
  isEmailDomainValid,
  isPostalCodeValid,
}