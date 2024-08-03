import Publication from "../models/publication.js"

// Acciones de prueba
export const testPublication = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde el controlador: publication.js"
  });
}

// Método para hacer una publicación
export const savePublication = async (req, res) => {
  try {

    // Obtener datos del body
    const params = req.body;

    // Verificar que llegue desde el body el parámetro text con su información
    if (!params.text) {
      return res.status(400).send({
        status: "error",
        message: "Debes enviar el texto de la publicación"
      });
    }

    // Crear el objeto del modelo
    let newPublication = new Publication(params);
    console.log('newPublication', newPublication)

    // Agregar la información del usuario autenticado al objeto de la nueva publicación
    newPublication.user_id = req.user.userId;

    // Guardar la nueva publicación en la BD
    const publicationStored = await newPublication.save();

    // Verificar si se guardó la publicación en la BD (si existe publicationStored)
    if (!publicationStored) {
      return res.status(500).send({
        status: "error",
        message: "No se ha guardado la publicación"
      });
    }

    // Devolver respuesta exitosa 
    return res.status(200).send({
      status: "success",
      message: "¡Publicación creada con éxito!",
      publicationStored
    });

  } catch (error) {
    console.log("Error al crear la publicación:", error);
    return res.status(500).send({
      status: "error",
      message: "Error al crear la publicación"
    });
  }
}

// Método para mostrar la publicación
export const showPublication = async (req, res) => {
  try {

    // Obtener el id de la publicación de la url
    const publicationId = req.params.id;

    // Buscar la publicación por id desde la BD
    const publicationStored = await Publication.findById(publicationId)
    .populate('user_id', 'name last_name');

    // Verificar si se encontró la publicación
    if (!publicationStored) {
      return res.status(500).send({
        status: "error",
        message: "No existe la publicación"
      });
    }

    // Devolver respuesta exitosa 
    return res.status(200).send({
      status: "success",
      message: "Publicación encontrada",
      publication: publicationStored
    });

  } catch (error) {
    console.log("Error al mostrar la publicación:", error);
    return res.status(500).send({
      status: "error",
      message: "Error al mostrar la publicación"
    });
  }
}

// Método para eliminar una publicación
export const deletePublication = async (req, res) => {
  try {
    // Obtener el id de la publicación que se quiere eliminar
    const publicationId = req.params.id;

    // Encontrar y eliminar la publicación
    const publicationDeleted = await Publication.findOneAndDelete({ user_id: req.user.userId, _id: publicationId}).populate('user_id', 'name last_name');

    // Verificar si se encontró y eliminó la publicación
    if (!publicationDeleted) {
      return res.status(404).send({
        status: "error",
        message: "No se ha encontrado o no tienes permiso para eliminar esta publicación"
      });
    }

    // Devolver respuesta exitosa 
    return res.status(200).send({
      status: "success",
      message: "Publicación eliminada con éxito",
      publication: publicationDeleted
    });

  } catch (error) {
    console.log("Error al mostrar la publicación:", error);
    return res.status(500).send({
      status: "error",
      message: "Error al eliminar la publicación"
    });
  }
}

// Método para listar publicaciones de un usuario
export const publicationsUser = async (req, res) => {
  try {
    // Obtener el id del usuario
    const userId = req.params.id;

    // Asignar el número de página
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;

    // Número de usuarios que queremos mostrar por página
    let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 5;

    // Configurar las opciones de la consulta
    const options = {
      page: page,
      limit: itemsPerPage,
      sort: { created_at: -1 },
      populate: {
        path: 'user_id',
        select: '-password -role -__v -email'
      },
      lean: true
    };

    // Buscar las publicaciones del usuario
    const publications = await Publication.paginate({ user_id: userId }, options);

    if (!publications.docs ||publications.docs.length <= 0 ){
      return res.status(404).send({
        status: "error",
        message: "No hay publicaciones para mostrar"
      });
    }

    // Devolver respuesta exitosa
    return res.status(200).send({
      status: "success",
      message: "Publicaciones del usuario: ",
      publications: publications.docs,
      total: publications.totalDocs,
      pages: publications.totalPages,
      page: publications.page,
      limit: publications.limit
    });

  } catch (error) {
    console.log("Error al mostrar la publicación:", error);
    return res.status(500).send({
      status: "error",
      message: "Error al listar las publicación"
    });
  }
}

// Método para subir archivos (imagen) a las publicaciones que hacemos
export const uploadMedia = async (req, res) => {
  try {
    

    // Devolver respuesta exitosa
    return res.status(200).send({
      status: "success",
      message: "MÉTODO PARA SUBIR ARCHIVO EN PUBLICACIÓN"
    });

  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al subir el archivo a la publicación"
    });
  }
}