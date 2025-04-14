import jwt from 'jsonwebtoken';
const dotenv = await import('dotenv');
dotenv.config();
class TokenClass {
  issue(payload, expiresIn) {
    try {
      return jwt.sign(payload, process.env.SECRETKEY, {
        expiresIn: expiresIn ? expiresIn : '1d',
      });
    } catch (error) {
      return false;
    }
  }

  verify(token) {
    try {
      return jwt.verify(token, process.env.SECRETKEY);
    } catch (error) {
      return false;
    }
  }
}
export default new TokenClass();
