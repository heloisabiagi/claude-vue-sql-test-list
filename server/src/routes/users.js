import { Router } from 'express';
import * as users from '../controllers/users/index.js';

export const usersRouter = Router();

usersRouter.get('/', users.list); //            GET    /api/users
usersRouter.post('/', users.create); //         POST   /api/users
usersRouter.get('/:id', users.get); //          GET    /api/users/:id
usersRouter.patch('/:id', users.update); //     PATCH  /api/users/:id
usersRouter.put('/:id', users.replace); //      PUT    /api/users/:id
usersRouter.delete('/:id', users.remove); //    DELETE /api/users/:id
