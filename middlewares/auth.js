import jwt from 'jwt-simple';
import moment from 'moment';
import { secret } from '../services/jwt.js';

// Asegurar la autenticación
export const ensureAuth = (req, res, next) => {
  // Comprobar si llego la cabecera de autenticacion
  if (!req.headers.authorization) {
    return res.status(403).send({
      status: "error",
      message: "La petición no tiene cabecera de autenticación"
    });
  }

  // Limpiar el token y quitar las comilla si las hay 
  const token = req.headers.authorization.replace(/['"]+/g, '');

  // Decodificar el token y comprobar si ha expirado
  try {
    let payload = jwt.decode(token, secret);
    console.log('payload', payload)

    //Comprobar si el token ha expirado
    if (payload.exp <= moment().unix()) {
      return res.status(401).send({
        status: "error",
        message: "El token ha expirado"
      });
    }

    // Agregar los datos del user
    req.user = payload;

  } catch (error) {
    return res.status(404).send({
      status: "error",
      message: "El token no es válido"
    })
  }

  // Pasar a la ejecución del siguiente método
  next();

};