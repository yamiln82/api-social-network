import UserModel from '../models/user.js'
import bcrypt from "bcrypt"
import { createToken } from '../services/jwt.js';
import fs from "fs";
import path from "path";
import { followThisUser, followUserIds } from "../services/followServices.js"

// Acciones de prueba
export const testUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde el controlador: user.js"
  });
}

// Registro de usuarios
export const register = async (req, res) => {
  try {
    // Recoger datos de la petición
    let params = req.body;
    console.log('params', params);

    if (!params.name || !params.last_name
      || !params.email || !params.nick || !params.password) {
      return res.status(400).send({
        status: "error",
        message: "Faltan datos por enviar"
      });
    }

    //Crear una instancia del modelo user con los datos validados
    let user_save = new UserModel(params);
    console.log('user_save', user_save)
    // Buscar si ya existe un usuario con el mismo email o nick
    const existUser = await UserModel.findOne({
      $or: [
        { email: user_save.email.toLowerCase() },
        { nick: user_save.nick.toLowerCase() }
      ]
    });

    console.log('existUser', existUser)
    // Si encuentra un usuario retorna un mensaje
    if (existUser) {
      return res.status(409).send({
        status: "success",
        message: "El usuario ya existe"
      });
    } else {
      console.log('entro al else de existUser')
    }

    // Cifrar contraseña
    //Encripta la contraseña
    const salt = await bcrypt.genSalt(10);
    const hasedPassword = await bcrypt.hash(user_save.password, salt);
    user_save.password = hasedPassword;
    console.log('user_save 2')
    //Guardar el usuario en base de datos
    await user_save.save();

    //Devolver respuesta exitosa y el usuario registrado
    return res.status(201).send({
      status: "created",
      message: "Usuario registrado con éxito",
      user: user_save
    });

  } catch (error) {
    console.log('error registro usuario', error);
    return res.status(500).send({
      status: "error",
      message: "Error en registro de usuario"
    });
  }
}

export const login = async (req, res) => {
  try {
    // Recoger los parametros del body
    let params = req.body;

    // Validar si llegaron el email y password
    if (!params.email || !params.password) {
      return res.status(400).send({
        status: "error",
        message: "Faltan datos por enviar"
      });
    }

    const user = await UserModel.findOne({
      email: params.email.toLowerCase()
    });

    //Si no existe el user
    if (!user) {
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado"
      });
    }

    // Comprobar si el password recibido es igual al que está almacenado en la BD
    const validPassword = await bcrypt.compare(params.password, user.password);

    // Si los password no coinciden 
    if (!validPassword) {
      return res.status(401).send({
        status: "error",
        message: "Contraseña incorrecta"
      });
    }

    // Generar token de autentificacion
    const token = createToken(user);

    // Devolver token generado y los datos del usuario   
    return res.status(200).json({
      status: "success",
      message: "El usuario se ha logueado",
      token,
      user: {
        id: user._id,
        name: user.name,
        last_name: user.last_name,
        bio: user.bio,
        email: user.email,
        nick: user.nick,
        role: user.role,
        image: user.image,
        created_at: user.created_at
      }

    });

  } catch (error) {
    console.log("Error en el login del usuario ", error);
    return res.status(500).send({
      status: "error",
      message: "Error en el login del usuario"
    });
  }
}

// Método para mostrar el perfil del usuario
export const profile = async (req, res) => {

  try {
    // Obtener el ID del usuario desde los parametros de la URL
    const userId = req.params.id;

    // Verificar si el ID recibido del usuario autenticado existe
    if (!req.user || !req.user.userId) {
      return res.status(404).send({
        status: "error",
        message: "Usuario no autenticado"
      });
    }

    // Buscar al usuario en la BD, excluimos la contraseña, rol, versión.
    const userProfile = await UserModel.findById(userId).select('-password -role -__v');

    //Verificar si el usuario existe
    if (!userProfile) {
      return res.status(404).send({
        status: "error",
        message: "usuario no encontrado"
      });
    }

    // Información de seguimiento - (req.user.userId = Id del usuario autenticado) 
    const followInfo = await followThisUser(req.user.userId, userId);

    return res.status(200).json({
      status: "success",
      message: "Método para ver el perfil del usuario",
      user: userProfile,
      followInfo
    });

  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al obtener el perfil del usuario"
    });
  }
}

// Método para listar usuarios con paginacion
export const listUsers = async (req, res) => {
  try {

    console.log('req', req.query)
    // Controlar en que pagina estamos y el número de items por pagina 
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;
    let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 5;

    // Realizar la consulta paginada
    const options = {
      page: page,
      limit: itemsPerPage,
      select: '-password -role -__v'
    };

    const users = await UserModel.paginate({}, options);
    console.log('user', users)

    // Si no hay usuario en la página solicitada
    if (!users || users.docs.length === 0) {
      return res.status(404).send({
        status: "error",
        message: "No hay usuarios disponibles"
      });
    }

    // Listar los seguidores de un usuario, obtener el array de IDs de los usuarios que sigo
    let followUsers = await followUserIds(req);

    // Devolver los usuarios paginados
    return res.status(200).send({
      status: "sucess",
      message: "Método listar usuarios",
      users: users.docs,
      totalDocs: users.totalDocs,
      totalPages: users.totalPages,
      page: users.page,
      pagingCounter: users.pagingCounter,
      hasNextPage: users.hasNextPage,
      hasPrevPage: users.hasPrevPage,
      prevPage: users.prevPage,
      nextPage: users.nextPage,
      users_following: followUsers.following,
      user_follow_me: followUsers.followers
    });

  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al listar los usuarios"
    });
  }
}

// Método para actualizar los datos del usuario
export const updateUser = async (req, res) => {
  try {

    // Recoger la información del usuario
    let userIdentity = req.user;
    let userToUpdate = req.body;

    // Validar que los campos necesarios esten presentes
    if (!userToUpdate.email || !userToUpdate.nick) {
      return res.status(400).send({
        status: "error",
        message: "Los campos email y nick son requeridos"
      });
    }

    // Eliminar campos sobrantes del objeto
    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;
    delete userToUpdate.image;

    //Comprobar si el usuario ya existe
    const users = await UserModel.find({
      $or: [
        { email: userToUpdate.email.toLowerCase() },
        { nick: userToUpdate.nick.toLowerCase() }
      ]
    }).exec();

    //Verificar si el usuario esta duplicado y evitar conflicto
    const isDuplicateUser = users.some(user => {
      return user && user._id.toString() !== userIdentity.userId;
    });

    if (isDuplicateUser) {
      return res.status(400).send({
        status: "error",
        message: "Solo se puede modificar los datos del usuario logueado"
      });
    }

    // Cifrar la ontraseña si se prporciona
    if (userToUpdate.password) {
      try {
        let pwd = await bcrypt.hash(userToUpdate.password, 10);
        userToUpdate.password = pwd;

      } catch (hasError) {
        return res.status(500).send({
          status: "error",
          message: "Error al cifrar la contraseña"
        });
      }
    } else {
      delete userToUpdate.password;
    }

    // Actualizar, buscar el usuario modificado
    let userUpdated = await UserModel.findByIdAndUpdate(userIdentity.userId, userToUpdate, { new: true });

    if (!userUpdated) {
      return res.status(400).send({
        status: "error",
        message: "Error al actualizar el usuario"
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Usuario actualizado",
      user: userUpdated
    });

  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al actualizar los datos del usuario"
    });
  }
}

// Metodo para subir imagenes
export const uploadFiles = async (req, res) => {
  try {

    // console.log('file'.req.file)
    // Capturar el archivo

    if (!req.file) {
      return res.status(404).send({
        status: "error",
        message: "La petición no invluye la imagen"
      });
    }

    // Conseguir el nombre del archivo
    let image = req.file.originalname;

    // Obtener la extension del archivo
    const imageSplit = image.split(".");
    const extension = imageSplit[imageSplit.length - 1];

    // Validar la extensión
    if (!["png", "jpg", "jpeg", "gif"].includes(extension.toLowerCase())) {
      // Borrar archivo subido
      const filePath = req.file.path;
      fs.unlinkSync(filePath);

      return res.status(400).send({
        status: "error",
        message: "Extensión del archivo inválida"
      });
    }

    // Comprobar tamaño del archivo (oj: max 5MB)
    const fileSize = req.file.size;
    const maxFileSize = 5 * 1024 * 1024 // 5MB

    if (fileSize > maxFileSize) {
      const filePath = req.file.path;
      fs.unlinkSync(filePath);
      return res.status(400).send({
        status: "error",
        message: "El tamaño del archivo excede el límite (máx 5B)"
      });
    }

    // Guardar la iamgen en la DB
    const userUpdated = await UserModel.findOneAndUpdate(
      { _id: req.user.userId },
      { image: req.file.filename },
      { new: true }
    );

    // Verificar si la actualización fue exitosa 
    if (!userUpdated) {
      return res.status(500).send({
        status: "error",
        message: "Error al subir la imagen"
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Ha subido correctamente el archivo",
      user: req.user,
      file: req.file,
      userUpdated
    });

  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al subir archivos"
    });
  }
}

// Metodo para mostrar la imagen del perfil (AVATAR)
export const avatar = async (req, res) => {
  try {

    // Obtener el parametro de la url
    const file = req.params.file;

    // Obtener el path real de la imagen
    const filePath = "./uploads/avatars/" + file;

    // comprobamos si existe
    fs.stat(filePath, (error, exists) => {
      if (!exists) {
        return res.status(404).send({
          status: "error",
          message: "No existe la imagen"
        });
      }
      // Devolve el archivo
      return res.sendFile(path.resolve(filePath));
    });


  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al mostrar la imagen "
    });
  }
}