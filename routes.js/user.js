// importaciones 
import { Router } from "express";
const router = Router();
import { avatar, listUsers, login, profile, register, testUser, updateUser, uploadFiles } from "../controllers/user.js";
import { ensureAuth } from "../middlewares/auth.js";
import multer from 'multer';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/avatars/");
    },
    filename: (req, file, cb) => {
        cb(null, "avatar-" + Date.now() + "-" + file.originalname);
    }
});

//Middleware para subida de archivos
const uploads = multer({ storage });

//Define las rutas
router.get('/test-user', ensureAuth, testUser);
router.post('/register', register);
router.post('/login', login);
router.get('/profile/:id', ensureAuth, profile);
router.get('/list/:page?', ensureAuth, listUsers);
router.put('/update', ensureAuth, updateUser); 
router.post('/upload', [ensureAuth, uploads.single("file0")], uploadFiles);
router.get('/avatar/:file', ensureAuth, avatar); 

// Exporta el router
export default router;