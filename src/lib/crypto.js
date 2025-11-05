import crypto from 'crypto'

function getKey() {
  const key = process.env.ENCRYPTION_KEY || ''
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes for AES-256-CBC')
  }
  return Buffer.from(key)
}

function getIv() {
  const iv = process.env.IV || ''
  if (iv.length !== 16) {
    throw new Error('IV must be 16 bytes for AES-256-CBC')
  }
  return Buffer.from(iv)
}

export function encrypt(plainText) {
  if (plainText === undefined || plainText === null) return plainText
  const text = String(plainText)
  try {
    const cipher = crypto.createCipheriv('aes-256-cbc', getKey(), getIv())
    let encrypted = cipher.update(text, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    return encrypted
  } catch (error) {
    // If encryption fails (missing keys), return original value for backward compatibility
    console.error('Encryption failed (missing ENCRYPTION_KEY or IV in .env):', error.message)
    return text
  }
}

export function decrypt(cipherText) {
  if (cipherText === undefined || cipherText === null) return cipherText
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', getKey(), getIv())
    let decrypted = decipher.update(String(cipherText), 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    // If decryption fails (missing keys or not encrypted), return original value
    return cipherText
  }
}

export const SENSITIVE_PATIENT_FIELDS = [
  'fullName',
  'mobileNumber',
  'address',
  'abhaId',
  'emergencyDescription',
]

export function encryptPatientFields(patient) {
  if (!patient || typeof patient !== 'object') return patient
  try {
    const copy = { ...patient }
    for (const field of SENSITIVE_PATIENT_FIELDS) {
      if (copy[field] !== undefined && copy[field] !== null) {
        copy[field] = encrypt(copy[field])
      }
    }
    // Map emergencyReason -> emergencyDescription if present
    if (copy.emergencyReason) {
      copy.emergencyDescription = encrypt(copy.emergencyReason)
    }
    return copy
  } catch (error) {
    // If encryption fails, return original patient data
    console.error('Failed to encrypt patient fields:', error.message)
    return patient
  }
}

export function decryptPatientFields(patient) {
  if (!patient || typeof patient !== 'object') return patient
  const copy = { ...patient }
  for (const field of SENSITIVE_PATIENT_FIELDS) {
    if (copy[field] !== undefined && copy[field] !== null) {
      try {
        copy[field] = decrypt(copy[field])
      } catch {
        // If value is not encrypted or corrupted, leave as is; don't log secrets
      }
    }
  }
  // Keep backward compatibility if emergencyReason stored unencrypted
  if (copy.emergencyDescription && typeof copy.emergencyDescription === 'string') {
    try {
      copy.emergencyReason = decrypt(copy.emergencyDescription)
    } catch {
      copy.emergencyReason = copy.emergencyDescription
    }
  }
  return copy
}


