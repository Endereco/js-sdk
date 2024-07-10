import CryptoJS from 'crypto-js'

class CryptoService {
  createHash (obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort())
    const hash = CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex)
    return hash
  }

  compareHash (hash, obj) {
    const newHash = this.createHash(obj)
    return hash === newHash
  }

  generateUniqueID () {
    return `${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`
  }
}

export default CryptoService
