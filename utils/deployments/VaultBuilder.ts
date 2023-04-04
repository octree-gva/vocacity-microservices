import { randomBytes } from 'crypto';
import _ from 'lodash'
class VaultBuilder {
    private attributes: Record<string, string> = {};
    private internalSecrets: Record<string, unknown> = {};
    constructor(internals: Record<string, unknown>){
      this.attributes = {}
      this.internalSecrets = {...internals}
    }
    
    get secrets(){
      return {...this.attributes};
    }
    
    internal(key: string) {
      if(_.has(this.internalSecrets, key))
        return this.internalSecrets[key];
      return "";
    }
    gen(key: string, length = 128){
      if(_.has(this.internalSecrets, key))
        return this.internalSecrets[key];
      if(!_.has(this.attributes, key)){
        _.set(this.attributes, key, VaultBuilder.random(length))
      }
      return _.get(this.attributes, key);
    }
    
    /**
     * generate a platform-friendly password with: 
     * - always a letter in first position
     * - no special chars hards to decode
     * 
     * @param length password length
     * @returns 
     */
    static random(length: number) {
      const randomFirst = _.sample([
        'a','b','c',
        'd','e','f',
        'g','h','i',
        'j','k','l',
        'm','n','o',
        'p','q','r',
        's','t','u',
        'v','w','x',
        'y','z'
      ])
      return `${randomFirst}${randomBytes(Math.ceil((length+4) / 2)).toString('hex')}`.slice(0, length);
    }
  }
  

  export default VaultBuilder