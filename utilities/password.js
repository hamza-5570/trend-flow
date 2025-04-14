import bcrypt from 'bcrypt';

const bcryptHash = (password) =>
  new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  });

// const hashPassword = async (password) => {
//   if (!password) {
//     return false;
//   }
//   const hash = await bcryptHash(password);
//   return {
//     hashedPassword: hash,
//   };
// };
const hashPassword = async (userPassword) => {
  const saltRound = 10;
  return await bcrypt.hash(userPassword, saltRound);
};
const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) {
    return false;
  }
  return bcrypt.compare(password, hashedPassword);
};

export { bcryptHash, hashPassword, comparePassword };
