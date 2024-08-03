// Importar dependencias
import jwt from 'jwt-simple';
import moment from 'moment';

// Clave secreta
const secret = 'SECRET_KEY_pRoJeCt_SoCiAl_NeTwOrK@';

// Metodo para generar tokens
const createToken = (user) => {
  // payload tiene la info del obj
  const payload = {
    userId: user._id,
    role: user.role,
    name: user.name,
    iat: moment().unix(), //Fecha de creacion-- unix() calcula los seg
    exp: moment().add(30, 'days').unix() // Fecha de expiracion en 30 días
  };

  // Devolver el token creado 
  return jwt.encode(payload, secret);
};

export { secret, createToken };